import asyncio
from app.services.yamnet_service import YAMNetService
import structlog
structlog.configure(
    processors=[structlog.processors.JSONRenderer()]
)

async def main():
    service = YAMNetService()
    await service.load()
    import numpy as np
    import soundfile as sf
    t = np.linspace(0, 5, 44100 * 5)
    # Generate some random noise which has broadband energy
    y = np.random.randn(len(t)).astype(np.float32) * 0.1
    sf.write('dummy.wav', y, 44100)
    
    result = await service.classify('dummy.wav')
    print(result)

if __name__ == '__main__':
    asyncio.run(main())
