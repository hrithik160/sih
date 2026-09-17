import os
import requests
from dotenv import load_dotenv

# Load .env
load_dotenv()

INFERENCE_KEY = os.getenv("INFERENCE_KEY")

URL = "https://dhruva-api.bhashini.gov.in/services/inference/pipeline"

SERVICE_ID = "ai4bharat/indictrans-v2-all-gpu--t4"

SOURCE_LANGUAGE = "en"
TARGET_LANGUAGE = "kn"

text = "Hello, how are you?"

headers = {
    "Accept": "*/*",
    "Authorization": INFERENCE_KEY,
    "Content-Type": "application/json"
}

payload = {
    "pipelineTasks": [
        {
            "taskType": "translation",
            "config": {
                "language": {
                    "sourceLanguage": SOURCE_LANGUAGE,
                    "targetLanguage": TARGET_LANGUAGE
                },
                "serviceId": SERVICE_ID
            }
        }
    ],
    "inputData": {
        "input": [
            {
                "source": text
            }
        ]
    }
}

response = requests.post(
    URL,
    headers=headers,
    json=payload
)

print("================================")
print("   BHASHINI TRANSLATION TEST")
print("================================")

print("Source language :", SOURCE_LANGUAGE)
print("Target language :", TARGET_LANGUAGE)

print("\nOriginal:")
print(text)

if response.status_code == 200:
    result = response.json()

    translated_text = result["pipelineResponse"][0]["output"][0]["target"]

    print("\nTranslated:")
    print(translated_text)

    print("\nStatus: SUCCESS")

else:
    print("\nStatus: FAILED")
    print("HTTP Status:", response.status_code)
    print(response.text)

print("================================")
