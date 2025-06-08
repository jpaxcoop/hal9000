# HAL9000

## Training a new voice model
If training a new voice model:

### Install F5-TTS (https://github.com/SWivid/F5-TTS)

### Create Python virtual environment, activate it, and install dependencies
```bash
python -m venv hal-cenv
source hal-venv/Scripts/activate
pip install -e .
```

### Install pytorch with your CUDA version, e.g.
```bash
pip install torch==2.7.0+cu128 torchaudio==2.7.0+cu128 --extra-index-url https://download.pytorch.org/whl/cu128
```

### Train (https://github.com/SWivid/F5-TTS/tree/main/src/f5_tts/train)

### Prepare, train, and finetune with Gradio
```bash
f5-tts_finetune-gradio
```

### Clone this repository

## If not training, just install the HAL9000 app

### Clone this repository

### Install Python dependencies
```bash
python -m venv hal-venv
source hal-venv/Scripts/activate
pip install -r requirements.txt
```

### Download an LLM model from Hugging Face
Recommended: https://huggingface.co/TheBloke/Mistral-7B-Instruct-v0.2-GGUF/blob/main/mistral-7b-instruct-v0.2.Q5_K_S.gguf

### Install Llama (https://github.com/ggml-org/llama.cpp?utm_source=chatgpt.com)
Allows you to prompt your LLM model.

Download the appropriate release from https://github.com/ggml-org/llama.cpp/releases

Extract into new folder `llm`

Move your LLM model into a new folder `llm/models`

## Start servers

### Start LLM server
```cmd
cd llm
llama-server.exe --model models/mistral-7b-instruct-v0.2.Q5_K_S.gguf --port 8080
```

or with optimizing parameters:
```cmd
cd llm
llama-server.exe ^
  --model models/mistral-7b-instruct-v0.2.Q5_K_S.gguf ^
  --port 8080 ^
  --threads 8 ^
  --ctx-size 2048 ^
  --n-predict 192 ^
  --mlock
```

### Start FastAPI
```bash
uvicorn api.app:app --reload
```

### Start Next.js site
```bash
npm run dev
```