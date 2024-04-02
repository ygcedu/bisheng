import asyncio
import httpx
import yaml
import logging
from urllib.parse import urlparse
from functools import lru_cache
from enum import Enum
from typing import Any, Mapping, Optional, Sequence

from langchain.tools import BaseTool
from langchain_core.messages import HumanMessage
from langchain_core.runnables import RunnableBinding
from langchain_core.language_models.base import LanguageModelLike
from bisheng_langchain.gpts.utils import import_by_type, import_class
from bisheng_langchain.gpts.load_tools import load_tools, get_all_tool_names


logger = logging.getLogger(__name__)


class ConfigurableAssistant(RunnableBinding):
    agent_executor_type: str
    tools: Sequence[BaseTool]
    llm: LanguageModelLike
    system_message: str
    interrupt_before_action: bool = False
    recursion_limit: int = 50

    def __init__(
        self,
        *,
        agent_executor_type: str, 
        tools: Sequence[BaseTool],
        llm: LanguageModelLike,
        system_message: str,
        interrupt_before_action: bool = False,
        recursion_limit: int = 50,
        kwargs: Optional[Mapping[str, Any]] = None,
        config: Optional[Mapping[str, Any]] = None,
        **others: Any,
    ) -> None:
        others.pop("bound", None)
        agent_executor_object = import_class(f'bisheng_langchain.gpts.agent_types.{agent_executor_type}')

        _agent_executor = agent_executor_object(tools, llm, system_message, interrupt_before_action)
        agent_executor = _agent_executor.with_config({"recursion_limit": recursion_limit})
        super().__init__(
            agent_executor_type=agent_executor_type,
            tools=tools,
            llm=llm,
            system_message=system_message,
            bound=agent_executor,
            kwargs=kwargs or {},
            config=config or {},
        )


class BishengAssistant:

    def __init__(self, yaml_path) -> None:
        self.yaml_path = yaml_path
        with open(self.yaml_path, 'r') as f:
            self.params = yaml.safe_load(f)

        self.assistant_params = self.params['assistant']

        # init assistant prompt
        prompt_type = self.assistant_params['prompt_type']
        assistant_message = import_class(f'bisheng_langchain.gpts.prompts.{prompt_type}')

        # init llm or agent
        llm_params = self.assistant_params['llm']
        llm_object = import_by_type(_type='llms', name=llm_params['type'])
        if llm_params['type'] == 'ChatOpenAI' and llm_params['openai_proxy']:
            llm_params.pop('type')
            llm = llm_object(http_client=httpx.AsyncClient(proxies=llm_params['openai_proxy']), **llm_params)
        else:
            llm_params.pop('type')
            llm = llm_object(**llm_params)
        
        # init tools
        available_tools = get_all_tool_names()
        tools = []
        for tool in self.assistant_params['tools']:
            tool_type = tool.pop('type')
            tool_config = tool if tool else {}
            if tool_type not in available_tools:
                raise ValueError(f"Tool type {tool_type} not found in TOOLS")
            _returned_tools = load_tools({tool_type: tool_config})
            if isinstance(_returned_tools, list):
                tools.extend(_returned_tools)
            else:
                tools.append(_returned_tools)
        
        # init agent executor
        agent_executor_params = self.assistant_params['agent_executor']
        agent_executor_type = agent_executor_params.pop('type')
        self.assistant = ConfigurableAssistant(
            agent_executor_type=agent_executor_type, 
            tools=tools, 
            llm=llm, 
            system_message=assistant_message, 
            **agent_executor_params
        )

    def run(self, query):
        inputs = [HumanMessage(content=query)]
        result = asyncio.run(self.assistant.ainvoke(inputs))
        return result


if __name__ == "__main__":
    query = "帮我查一下去年这一天发生了哪些重大事情？"
    bisheng_assistant = BishengAssistant("config/base_assistant.yaml")
    result = bisheng_assistant.run(query)
    for r in result:
        print(f'------------------')
        print(type(r), r)