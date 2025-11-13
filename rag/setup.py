from setuptools import setup, find_packages

setup(
    name="lightrag",
    version="0.1.0",
    packages=find_packages(),
    install_requires=[
        "numpy",
        "dotenv",
        "httpx",
        
    ],
    author="ethancurb",
    description="A RAG (Retrieval-Augmented Generation) system",
    python_requires=">=3.7",
)