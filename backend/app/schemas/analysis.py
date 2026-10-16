from typing import Any, Literal

from pydantic import BaseModel, Field, field_validator

Operation = Literal[
    "stats", "sentiment", "emotion", "entities", "keywords", "pos",
    "summary", "zero_shot", "excuse", "syntax", "language"
]


class AnalyzeRequest(BaseModel):
    text: str = Field(min_length=1, max_length=20000)
    operations: list[Operation] = Field(
        default_factory=lambda: ["stats", "sentiment", "entities", "keywords", "excuse"],
        min_length=1,
        max_length=11,
    )
    labels: list[str] = Field(default_factory=list, max_length=20)

    @field_validator("text")
    @classmethod
    def text_not_blank(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Text cannot be blank.")
        return value

    @field_validator("operations")
    @classmethod
    def unique_operations(cls, value: list[Operation]) -> list[Operation]:
        return list(dict.fromkeys(value))

    @field_validator("labels")
    @classmethod
    def clean_labels(cls, value: list[str]) -> list[str]:
        cleaned = list(dict.fromkeys(item.strip() for item in value if item.strip()))
        if len(cleaned) > 20:
            raise ValueError("Provide at most 20 non-empty labels.")
        if any(len(item) > 80 for item in cleaned):
            raise ValueError("Each label must be 80 characters or fewer.")
        return cleaned


class SimilarityRequest(BaseModel):
    text_a: str = Field(min_length=1, max_length=20000)
    text_b: str = Field(min_length=1, max_length=20000)

    @field_validator("text_a", "text_b")
    @classmethod
    def text_not_blank(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Both texts must contain non-whitespace characters.")
        return value


class CorpusSearchRequest(BaseModel):
    query: str = Field(min_length=1, max_length=2000)
    top_k: int = Field(default=5, ge=1, le=20)

    @field_validator("query")
    @classmethod
    def query_not_blank(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Search query cannot be blank.")
        return value


class ToolInfo(BaseModel):
    id: str
    name: str
    description: str
    category: str


class AnalysisResponse(BaseModel):
    text_length: int
    results: dict[str, Any]
    warnings: list[str] = Field(default_factory=list)
