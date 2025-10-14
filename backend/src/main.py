"""
Analyst Copilot Backend — FastAPI Application Entry Point

This is the main application file that initializes the FastAPI server,
configures middleware, registers API routes, and sets up the application lifecycle.

Author: Ethan Curb
Project: USAF 16AF Analyst Copilot
Last Updated: 2025-10-11
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import structlog
import time

from config import settings
# from api import packages, llm, enrichment, health  # Will be created next
# from db.database import init_db  # Will be created next
# from rag.vectorstore import init_vectorstore  # Will be created next

# Configure structured logging
structlog.configure(
    processors=[
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.add_log_level,
        structlog.processors.JSONRenderer(),
    ],
)
logger = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifecycle manager — handles startup and shutdown events.
    
    On Startup:
        - Initialize database connection pool
        - Load MITRE ATT&CK data into vector store
        - Warm up LLM connection
    
    On Shutdown:
        - Close database connections
        - Cleanup vector store resources
    """
    logger.info("application_startup", app_name=settings.APP_NAME, version=settings.APP_VERSION)
    
    # TODO: Initialize database
    # await init_db()
    
    # TODO: Initialize vector store
    # await init_vectorstore()
    
    logger.info("application_ready", message="All systems initialized")
    
    yield  # Application runs here
    
    logger.info("application_shutdown", message="Cleaning up resources")
    # TODO: Cleanup logic here


# Initialize FastAPI application
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="""
    **Analyst Copilot Backend API**
    
    Demo-to-production SOC analyst tool that uses LLM-powered RAG to generate 
    draft security reports from alert packages. This API provides endpoints for:
    
    - Package management (upload, list, retrieve, version)
    - LLM operations (generate report, ask questions, regenerate sections)
    - Enrichment (MITRE ATT&CK mapping, MISP threat intel)
    - Provenance tracking (audit LLM calls and references)
    
    **Authentication**: Not enabled in demo mode. OAuth2/CAC required in production.
    
    **Rate Limits**: Not enforced in demo. Production will use token bucket.
    """,
    docs_url="/api/docs",  # Swagger UI
    redoc_url="/api/redoc",  # ReDoc
    openapi_url="/api/openapi.json",
    lifespan=lifespan,
)


# ── Middleware Configuration ────────────────────────────────────────────────

# CORS: Allow frontend to make requests from different origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"],  # Allow all headers
)


# Request logging middleware: Log all incoming requests with timing
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all HTTP requests with timing information."""
    start_time = time.time()
    
    # Log request
    logger.info(
        "request_started",
        method=request.method,
        path=request.url.path,
        client_ip=request.client.host if request.client else "unknown",
    )
    
    # Process request
    response = await call_next(request)
    
    # Calculate duration
    duration_ms = (time.time() - start_time) * 1000
    
    # Log response
    logger.info(
        "request_completed",
        method=request.method,
        path=request.url.path,
        status_code=response.status_code,
        duration_ms=round(duration_ms, 2),
    )
    
    return response


# ── Exception Handlers ──────────────────────────────────────────────────────

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Catch-all exception handler for unexpected errors."""
    logger.error(
        "unhandled_exception",
        error=str(exc),
        error_type=type(exc).__name__,
        path=request.url.path,
        method=request.method,
        exc_info=True,
    )
    
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "message": "An unexpected error occurred. Please contact support.",
            "type": type(exc).__name__,
            # Include details only in development
            "details": str(exc) if settings.DEBUG else None,
        },
    )


# ── API Routes ──────────────────────────────────────────────────────────────

@app.get("/", tags=["Root"])
async def root():
    """Root endpoint — API health check and metadata."""
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "status": "operational",
        "docs": "/api/docs",
        "features": {
            "rag_enabled": settings.ENABLE_RAG,
            "provenance_tracking": settings.ENABLE_PROVENANCE_TRACKING,
            "misp_enabled": settings.MISP_ENABLED,
        },
    }


@app.get("/health", tags=["Health"])
async def health_check():
    """
    Health check endpoint for load balancers and monitoring.
    
    Returns:
        - status: "healthy" if all systems operational
        - checks: Individual system health statuses
    """
    # TODO: Add actual health checks (DB, ChromaDB, LLM API)
    return {
        "status": "healthy",
        "checks": {
            "database": "healthy",  # TODO: Actual DB ping
            "vectorstore": "healthy",  # TODO: Actual ChromaDB ping
            "llm_api": "healthy",  # TODO: Actual OpenAI/Gemini ping
        },
    }


# TODO: Register API routers
# app.include_router(packages.router, prefix="/api/packages", tags=["Packages"])
# app.include_router(llm.router, prefix="/api/llm", tags=["LLM"])
# app.include_router(enrichment.router, prefix="/api/enrichment", tags=["Enrichment"])
# app.include_router(health.router, prefix="/api", tags=["Health"])


# ── Application Entry Point ─────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "main:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=settings.API_RELOAD,
        log_level=settings.LOG_LEVEL.lower(),
    )
