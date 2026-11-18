# NeuroBridge - AI Communication Bridge

NeuroBridge is an AI-powered communication tool designed to help bridge communication gaps between individuals with Autism Spectrum Disorder (ASD) and neurotypical (NT) individuals.

## Features

- **Role-based Translation**: Translate messages between ASD and NT communication styles
- **Intent Analysis**: Understand what the person is trying to communicate
- **Misunderstanding Detection**: Identify potential communication barriers
- **Emotion Intensity Meter**: Visual representation of emotional state (0-100)
- **Tone Adjustment**: Modify message tone (direct, gentle, empathetic)
- **Translation History**: Save and manage past translations
- **Privacy-First**: History is stored only in your browser. Text you enter is sent through our server to a third-party model provider (Alibaba Cloud Bailian / xAI / OpenAI) to generate a response; the server logs request metadata and text length only, and does not store your text.

## Tech Stack

### Frontend
- React 19 with TypeScript
- Tailwind CSS for styling
- Zustand for state management
- Axios for API calls
- Vite for build tooling

### Backend
- FastAPI with Python
- Pydantic for data validation
- LLM Adapters (Wenxin 4.5, GPT-4o)
- Structured logging
- CORS support

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- Python 3.8+
- API keys for Wenxin (Baidu) and/or OpenAI

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Set up environment variables:
```bash
# Create .env file with your API keys
WENXIN_API_KEY=your_wenxin_api_key
WENXIN_SECRET_KEY=your_wenxin_secret_key
OPENAI_API_KEY=your_openai_api_key
```

5. Run the backend server:
```bash
python main.py
```

The API will be available at `http://localhost:8000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

## API Endpoints

- `POST /api/v1/translate` - Translate text between communication styles
- `POST /api/v1/tone-adjust` - Adjust text tone
- `GET /api/v1/health` - Health check
- `GET /api/v1/status` - Service status

## Usage

1. **Select Your Role**: Choose whether you identify as ASD, NT, or uncertain
2. **Enter Your Message**: Type the text you want to translate
3. **Get Translation**: Receive intent analysis, misunderstanding detection, and improved version
4. **Adjust Tone**: Modify the message to be more direct, gentle, or empathetic
5. **View Emotion Meter**: See the emotional intensity of your message
6. **Save to History**: Access your past translations anytime

## Privacy & Medical Disclaimer

- **Privacy**: Text you enter is sent through our server to a third-party AI model provider to generate a response. Our server logs request metadata and text length only, and does not store your text.
- **Medical**: This tool is for educational purposes only and not a substitute for professional medical advice.
- **Data**: Translation history is saved only in your browser's local storage and can be cleared anytime. The model provider processes the text under their own terms — please do not enter medical records, credentials, or other sensitive personal information.

## Development

### Project Structure
```
NeurodiversityTranslator/
├── backend/
│   ├── app/
│   │   ├── adapters/     # LLM service adapters
│   │   ├── api/         # API endpoints
│   │   ├── models/      # Pydantic models
│   │   └── services/    # Business logic
│   ├── main.py          # FastAPI application
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── services/    # API client
│   │   ├── store/       # State management
│   │   └── types/       # TypeScript types
│   └── package.json
└── README.md
```

### Adding New LLM Adapters

1. Create a new adapter class in `backend/app/adapters/`
2. Inherit from `LLMAdapter` base class
3. Implement required methods: `check_availability()`, `translate()`, `adjust_tone()`
4. Add the adapter to `LLMService` in `backend/app/services/llm_service.py`

## Contributing

This project is designed to help the neurodiverse community. Contributions that improve accessibility, usability, or accuracy are welcome.

## License

This project is for educational and community use. Please respect privacy and medical guidelines when using this tool.

## Support

For questions or support, please contact the development team or create an issue in the project repository.