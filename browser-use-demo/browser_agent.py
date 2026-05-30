import asyncio
from browser_use import Agent, AgentHistoryList
from browser_use.llm import ChatOllama
from config import OLLAMA_BASE_URL

class BrowserAgentRunner:
    def __init__(self, model_name: str, temperature: float = 0.0):
        self.model_name = model_name
        self.temperature = temperature
        
    def _get_llm(self):
        """Initialize the local Ollama LLM natively via browser-use's LLM module."""
        return ChatOllama(
            host=OLLAMA_BASE_URL,
            model=self.model_name,
            ollama_options={
                "temperature": self.temperature,
                "num_ctx": 32000,
            }
        )
        
    async def run_task(self, task: str, headless: bool = False) -> AgentHistoryList:
        """Run the specified task using the browser-use agent."""
        llm = self._get_llm()
        
        # Initialize native browser-use agent
        # use_vision=False disables large screenshots to the local LLM
        agent = Agent(
            task=task,
            llm=llm,
        )
        
        print(f"\n[BrowserAgent] Starting task with model '{self.model_name}' (Headless: {headless})...")
        print(f"[BrowserAgent] Task: {task}\n")
        
        history = await agent.run()
        return history
