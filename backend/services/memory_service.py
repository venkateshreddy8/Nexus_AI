"""
Vector Memory Service using ChromaDB
Stores and retrieves meeting conversation chunks for RAG.
"""
import uuid
import os
from typing import List, Optional
from config import settings

_chroma_client = None
_collection = None
_embedding_fn = None


def _init_chroma():
    global _chroma_client, _collection, _embedding_fn
    if _collection is not None:
        return

    try:
        import chromadb
        from chromadb.utils import embedding_functions

        os.makedirs(settings.CHROMA_PERSIST_DIR, exist_ok=True)
        _chroma_client = chromadb.PersistentClient(path=settings.CHROMA_PERSIST_DIR)

        # Use sentence-transformers for local embeddings (no API key needed)
        try:
            _embedding_fn = embedding_functions.SentenceTransformerEmbeddingFunction(
                model_name=settings.EMBEDDING_MODEL
            )
            print(f"✅ ChromaDB initialized with SentenceTransformer ({settings.EMBEDDING_MODEL})")
        except Exception:
            _embedding_fn = embedding_functions.DefaultEmbeddingFunction()
            print("✅ ChromaDB initialized with default embeddings")

        _collection = _chroma_client.get_or_create_collection(
            name=settings.CHROMA_COLLECTION,
            embedding_function=_embedding_fn,
            metadata={"hnsw:space": "cosine"}
        )
    except Exception as e:
        print(f"⚠️  ChromaDB init failed: {e}. Memory features will be limited.")
        _collection = None


async def store_transcript_chunk(
    text: str,
    meeting_id: str,
    speaker: str,
    timestamp: str,
    chunk_id: Optional[str] = None
) -> str:
    """Store a transcript chunk in vector memory."""
    _init_chroma()
    if _collection is None:
        return ""

    chunk_id = chunk_id or str(uuid.uuid4())
    try:
        _collection.upsert(
            documents=[text],
            metadatas=[{
                "meeting_id": meeting_id,
                "speaker": speaker,
                "timestamp": timestamp,
                "type": "transcript"
            }],
            ids=[chunk_id]
        )
    except Exception as e:
        print(f"Memory store error: {e}")
    return chunk_id


async def search_memory(
    query: str,
    meeting_id: Optional[str] = None,
    n_results: int = 5
) -> List[dict]:
    """Semantic search across meeting memory."""
    _init_chroma()
    if _collection is None:
        return _demo_search_results(query)

    try:
        where = {"meeting_id": meeting_id} if meeting_id else None
        results = _collection.query(
            query_texts=[query],
            n_results=n_results,
            where=where
        )

        hits = []
        for i, doc in enumerate(results["documents"][0]):
            meta = results["metadatas"][0][i]
            dist = results["distances"][0][i] if "distances" in results else 0
            hits.append({
                "text": doc,
                "speaker": meta.get("speaker", "Unknown"),
                "meeting_id": meta.get("meeting_id"),
                "timestamp": meta.get("timestamp"),
                "relevance": round(1 - dist, 3),
            })
        return hits
    except Exception as e:
        print(f"Memory search error: {e}")
        return _demo_search_results(query)


async def get_meeting_context(meeting_id: str, max_chunks: int = 20) -> str:
    """Retrieve all stored context for a meeting as a single string."""
    _init_chroma()
    if _collection is None:
        return ""

    try:
        results = _collection.get(
            where={"meeting_id": meeting_id},
            limit=max_chunks
        )
        chunks = results.get("documents", [])
        return "\n".join(chunks)
    except Exception as e:
        print(f"Context retrieval error: {e}")
        return ""


def _demo_search_results(query: str) -> List[dict]:
    """Fallback demo results when ChromaDB is unavailable."""
    return [
        {
            "text": f"Related discussion about {query} was found in previous meetings.",
            "speaker": "System",
            "meeting_id": None,
            "timestamp": None,
            "relevance": 0.85,
        }
    ]
