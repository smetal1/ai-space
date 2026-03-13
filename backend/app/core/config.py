from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "AI Space"

    # Claude API (Anthropic)
    anthropic_api_key: str = ""
    claude_model: str = "claude-sonnet-4-20250514"

    # vLLM (OpenAI-compatible endpoint for open-source models)
    vllm_base_url: str = "http://localhost:8000/v1"
    vllm_model: str = "Qwen/Qwen3.5-9B"
    vllm_api_key: str = "EMPTY"

    # Default provider: "claude" or "vllm"
    default_provider: str = "claude"

    # Agent workspace directory
    agent_workspace: str = "/tmp/agent-workspace"

    # CORS
    cors_origins: list[str] = ["http://localhost:5173", "http://localhost:3000"]

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
