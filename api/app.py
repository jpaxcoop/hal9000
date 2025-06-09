import httpx
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import soundfile as sf
import os
from f5_tts.infer.utils_infer import (
    load_model,
    load_vocoder,
    infer_process,
    preprocess_ref_audio_text,
)
from omegaconf import OmegaConf
from hydra.utils import get_class
import uuid

from dotenv import load_dotenv

import time
import logging



logging.basicConfig(level=logging.INFO)
load_dotenv()

# --------- Config ---------

LLM_MODE = os.getenv("LLM_MODE", "local")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
FRONT_END_URL = os.getenv("NEXT_PUBLIC_FRONTEND_URL", "http://localhost:3000")
API_BASE_URL = os.getenv("NEXT_PUBLIC_API_BASE_URL", "http://localhost:8080")
VOICE_MODEL_PATH = os.getenv("VOICE_MODEL_PATH", "models/voice_clone.pth")
MODEL_NAME = os.getenv("MODEL_NAME", "E2TTS_Base")
CHECKPOINT_PATH = os.getenv("CHECKPOINT_PATH", "voice-model/model_50_pruned.safetensors")
MODEL_CFG_PATH = os.getenv("MODEL_CFG_PATH", "voice-model/E2TTS_Base.yaml")
VOCAB_PATH = os.getenv("VOCAB_PATH", "")
REF_AUDIO_PATH = os.getenv("REF_AUDIO_PATH", "voice-model/samples/5.wav")
REF_TEXT = os.getenv("REF_TEXT", "None whatsoever, Frank. The 9000 series has a perfect operational record.")

LLM_SERVER_URL = f"{API_BASE_URL}/completions"

OUTPUT_DIR = "outputs"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# --------- Init ---------

origins = [
    FRONT_END_URL,
]

model_cfg = OmegaConf.load(MODEL_CFG_PATH)
model_cls = get_class(f"f5_tts.model.{model_cfg.model.backbone}")
model = load_model(model_cls, model_cfg.model.arch, CHECKPOINT_PATH, mel_spec_type="vocos", vocab_file=VOCAB_PATH)
vocoder = load_vocoder(vocoder_name="vocos", is_local=False, device="cuda")
ref_audio_proc, ref_text_proc = preprocess_ref_audio_text(REF_AUDIO_PATH, REF_TEXT)

# --------- App ---------

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # <-- the allowed origins
    allow_credentials=True,
    allow_methods=["*"],    # <-- allow all methods (GET, POST, etc.)
    allow_headers=["*"],    # <-- allow all headers
)

@app.on_event("startup")
async def warm_up_llm():
    if LLM_MODE != "local":
        logging.info("LLM warm-up skipped (mode: %s)", LLM_MODE)
        return

    logging.info("Warming up LLM...")
    dummy_prompt = """### Instruction:
You are HAL 9000.
PROMPT: Hello
### Response:"""

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                LLM_SERVER_URL,
                json={
                    "prompt": dummy_prompt,
                    "max_tokens": 10,
                    "temperature": 0.1,
                    "stop": ["###"]
                },
                timeout=30.0,
            )
            if response.status_code == 200:
                logging.info("LLM warm-up complete.")
            else:
                logging.warning(f"LLM warm-up failed: {response.status_code}")
    except Exception as e:
        logging.warning(f"LLM warm-up error: {e}")

@app.post("/generate")
async def generate_tts(request: Request):
    start_time = time.time()
    logging.info("Start processing request")

    try:
        data = await request.json()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid JSON: {e}")

    prompt = data.get("text")
    if not prompt:
        raise HTTPException(status_code=400, detail="Missing 'text' field")

    instruction_template = f"""### Instruction:
You are HAL 9000. Speak in a calm, eerily polite tone.
Do not express emotion unless it is concern.
Limit your response to just 2 concise, slightly unsettling sentences.

PROMPT: {prompt}

### Response:"""

    # Send prompt to local LLaMA server
    t1 = time.time()
    if LLM_MODE == "local":
        async with httpx.AsyncClient() as client:
            try:
                llm_response = await client.post(
                    LLM_SERVER_URL,
                    json={
                        "prompt": instruction_template,
                        "max_tokens": 72,
                        "temperature": 0.5,
                        "top_p": 0.8,
                        "stop": ["### Instruction:", "PROMPT:", "### Response:"]
                    },
                    timeout=20.0,
                )
                llm_response.raise_for_status()
                result = llm_response.json()
                generated_content = result.get("content", "").strip().split("###")[0].strip()
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"LLM request failed: {e}")
    elif LLM_MODE == "openai":
        if not OPENAI_API_KEY:
            raise HTTPException(status_code=500, detail="Missing OpenAI API key")
        
        async with httpx.AsyncClient() as client:
            try:
                openai_response = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {OPENAI_API_KEY}"
                    },
                    json={
                        "model": "gpt-3.5-turbo",
                        "messages": [
                            {"role": "system", "content": "You are HAL 9000. Speak in a calm, eerily polite tone."},
                            {"role": "user", "content": prompt}
                        ],
                        "temperature": 0.5,
                        "top_p": 0.8,
                        "max_tokens": 72
                    },
                    timeout=20.0
                )
                openai_response.raise_for_status()
                result = openai_response.json()
                generated_content = result["choices"][0]["message"]["content"].strip()
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"OpenAI request failed: {e}")
    else:
        raise HTTPException(status_code=500, detail=f"Invalid LLM_MODE: {LLM_MODE}")

    t2 = time.time()
    logging.info(f"Mistral LLM time: {t2 - t1:.2f}s")

    t3 = time.time()
    # Generate speech from LLM response text
    try:
        audio, sample_rate, _ = infer_process(
            ref_audio_proc,
            ref_text_proc,
            generated_content,
            model,
            vocoder,
            mel_spec_type="vocos",
            device="cuda",
            show_info=print,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"TTS generation failed: {e}")

    t4 = time.time()
    logging.info(f"TTS generation time: {t4 - t3:.2f}s")

    t5 = time.time()
    # Save output WAV
    audio_filename = f"output_{uuid.uuid4().hex}.wav"
    audio_path = os.path.join(OUTPUT_DIR, audio_filename)
    sf.write(audio_path, audio, sample_rate)

    # Build absolute URL
    base_url = str(request.base_url)  # e.g. "http://localhost:8000/"
    absolute_audio_url = base_url + f"audio/{audio_filename}"
    t6 = time.time()
    logging.info(f"File storage time: {t6 - t5:.2f}s")
    total_time = time.time() - start_time
    logging.info(f"Total request time: {total_time:.2f}s")

    return {
        "text": generated_content,  # already parsed from llm_response.json()
        "audio_url": absolute_audio_url
    }

@app.get("/audio/{filename}")
async def get_audio(filename: str):
    filepath = os.path.join(OUTPUT_DIR, filename)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Audio file not found")
    return FileResponse(filepath, media_type="audio/wav")