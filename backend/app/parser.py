import os
from google.api_core.client_options import ClientOptions
from google.cloud import documentai
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    """
    Sends the PDF bytes to Google Document AI OCR processor 
    and returns the extracted raw text.
    """
    project_id = os.environ.get("DOCAI_PROJECT_ID")
    location = os.environ.get("DOCAI_LOCATION", "eu") # Default to eu if missing
    processor_id = os.environ.get("DOCAI_PROCESSOR_ID")

    if not project_id or not processor_id:
        raise ValueError("Missing Document AI configuration in environment variables.")

    # You must set the api_endpoint if you use a location other than 'us'.
    opts = ClientOptions(api_endpoint=f"{location}-documentai.googleapis.com")

    # Create the Document AI client
    client = documentai.DocumentProcessorServiceClient(client_options=opts)

    # The full resource name of the processor
    name = client.processor_path(project_id, location, processor_id)

    # Convert bytes to a RawDocument object
    raw_document = documentai.RawDocument(
        content=pdf_bytes, mime_type="application/pdf"
    )

    # Configure the process request
    request = documentai.ProcessRequest(
        name=name,
        raw_document=raw_document
    )

    # Call Document AI (this performs the actual network request and costs money)
    result = client.process_document(request=request)

    # The document object contains the final text along with layout/metadata
    document = result.document

    return document.text
