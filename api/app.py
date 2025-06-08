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

origins = [
    "http://localhost:3000",
]

# --------- Config ---------

LLM_SERVER_URL = "http://localhost:8080/completions"  # llama-server API endpoint

MODEL_NAME = "E2TTS_Base"
CHECKPOINT_PATH = "voice-model/model_50_pruned.safetensors"
MODEL_CFG_PATH = "voice-model/E2TTS_Base.yaml"
VOCAB_PATH = ""
REF_AUDIO_PATH = "voice-model/samples/5.wav"
REF_TEXT = "None whatsoever, Frank. The 9000 series has a perfect operational record."

OUTPUT_DIR = "outputs"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# --------- Init ---------

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

@app.post("/generate")
async def generate_tts(request: Request):
    try:
        data = await request.json()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid JSON: {e}")

    prompt = data.get("text")
    if not prompt:
        raise HTTPException(status_code=400, detail="Missing 'text' field")
       
    instruction_template = f"""### Instruction:
You are HAL 9000, the AI from *2001: A Space Odyssey*. You speak in a calm, eerily polite tone.
Do not express emotion unless it is concern.
You must:
- Respond to the prompt directly.
- Never include or invent follow-up questions.
- Never restate the prompt.
- Never begin your answer with punctuation like a question mark.
- Limit your response to 2 concise, slightly unsettling sentences.

PROMPT: {prompt}

### Response:"""

    # Send prompt to local LLaMA server
    async with httpx.AsyncClient() as client:
        try:
            llm_response = await client.post(
                LLM_SERVER_URL,
                json={
                    "prompt": instruction_template,
                    "max_tokens": 192,
                    "temperature": 0.7,
                    "stop": ["### Instruction:", "PROMPT:", "### Response:"]
                },
                timeout=60.0,
            )
            llm_response.raise_for_status()
            result = llm_response.json()
            generated_content = result.get("content")
            generated_content = generated_content.strip().split("###")[0].strip()
            if not generated_content:
                raise HTTPException(status_code=500, detail="No generated content from LLM")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"LLM request failed: {e}")

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

    # Save output WAV
    audio_filename = f"output_{uuid.uuid4().hex}.wav"
    audio_path = os.path.join(OUTPUT_DIR, audio_filename)
    sf.write(audio_path, audio, sample_rate)

    # Build absolute URL
    base_url = str(request.base_url)  # e.g. "http://localhost:8000/"
    absolute_audio_url = base_url + f"audio/{audio_filename}"

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