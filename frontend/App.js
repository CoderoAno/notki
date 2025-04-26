import { useState, useEffect, useRef } from 'react';
import CanvasDraw from "react-canvas-draw";

function App() {
  const [nick, setNick] = useState(localStorage.getItem('nick') || '');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [drawings, setDrawings] = useState([]);
  const [isErasing, setIsErasing] = useState(false);
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [showCursor, setShowCursor] = useState(false);

  // Używamy ref do CanvasDraw, by mieć dostęp do instancji
  const canvasRef = useRef(null);

  // Inicjalizacja białego tła po zamontowaniu
  useEffect(() => {
    if (canvasRef.current) {
      const canvasInstance = canvasRef.current.canvas;
      const drawingCanvas = canvasInstance.drawing;
      const ctx = drawingCanvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, drawingCanvas.width, drawingCanvas.height);
    }
  }, [canvasRef]);

  useEffect(() => {
    fetch('/api/messages')
      .then(r => r.json())
      .then(setMessages);

    fetch('/api/drawings')
      .then(r => r.json())
      .then(setDrawings);
  }, []);

  const saveNick = () => {
    localStorage.setItem('nick', nick);
  };

  const sendMessage = () => {
    if (!message.trim() || !nick.trim()) return;

    fetch('/api/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ nick, text: message })
    })
      .then(response => response.json())
      .then(data => {
        setMessages([...messages, { nick, text: message }]);
        setMessage('');
      });
  };

  const saveDrawing = () => {
    if (!canvasRef.current || !nick.trim()) return;

    const data = canvasRef.current.getSaveData();
    fetch('/api/drawings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ nick, data })
    })
      .then(response => {
        setDrawings([...drawings, { nick, data }]);
      });
  };

  // Przełączanie gumki
  const toggleEraser = () => {
    setIsErasing(!isErasing);
  };

  // Śledzenie pozycji kursora
  const handleMouseMove = (e) => {
    if (!canvasRef.current) return;

    const canvasRect = e.currentTarget.getBoundingClientRect();
    setCursorPosition({
      x: e.clientX - canvasRect.left,
      y: e.clientY - canvasRect.top - 20 // Nad kursorem
    });
  };

  // Pobieranie rysunku z białym tłem
  const downloadDrawing = () => {
    if (!canvasRef.current) return;

    const drawingCanvas = canvasRef.current.canvas.drawing;
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = drawingCanvas.width;
    tempCanvas.height = drawingCanvas.height;

    // Białe tło
    tempCtx.fillStyle = '#ffffff';
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

    // Rysunek
    tempCtx.drawImage(drawingCanvas, 0, 0);

    const dataURL = tempCanvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `drawing-by-${nick || 'anonymous'}-${Date.now()}.png`;
    link.href = dataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Pobieranie chatu jako txt
  const downloadChat = () => {
    if (!messages.length) return;

    const chatText = messages.map(m => `${m.nick}: ${m.text}`).join('\n');
    const blob = new Blob([chatText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = `chat-history-${Date.now()}.txt`;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="app-container" style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>Aplikacja do rysowania i czatu</h1>

      <div className="user-section" style={{ marginBottom: '20px' }}>
        <input
          value={nick}
          onChange={e => setNick(e.target.value)}
          placeholder="Twój nick"
          style={{ padding: '8px', marginRight: '10px' }}
        />
        <button
          onClick={saveNick}
          style={{ padding: '8px 16px' }}
        >
          Zapisz nick
        </button>
      </div>

      <div className="content" style={{ display: 'flex', gap: '20px' }}>
        <div className="drawing-section" style={{ flex: 1 }}>
          <h2>Rysowanie</h2>

          <div className="drawing-tools" style={{ marginBottom: '10px' }}>
            <button
              onClick={toggleEraser}
              style={{
                padding: '8px 16px',
                marginRight: '10px',
                backgroundColor: isErasing ? '#f0f0f0' : '#fff'
              }}
            >
              {isErasing ? 'Ołówek' : 'Gumka'}
            </button>

            <button
              onClick={saveDrawing}
              style={{ padding: '8px 16px', marginRight: '10px' }}
            >
              Zapisz rysunek
            </button>

            <button
              onClick={downloadDrawing}
              style={{ padding: '8px 16px' }}
            >
              Pobierz obrazek
            </button>
          </div>

          <div
            style={{ position: 'relative' }}
            onMouseEnter={() => setShowCursor(true)}
            onMouseLeave={() => setShowCursor(false)}
            onMouseMove={handleMouseMove}
          >
            {showCursor && (
              <div
                style={{
                  position: 'absolute',
                  left: `${cursorPosition.x}px`,
                  top: `${cursorPosition.y}px`,
                  backgroundColor: 'rgba(0, 0, 0, 0.7)',
                  color: 'white',
                  padding: '2px 6px',
                  borderRadius: '3px',
                  fontSize: '12px',
                  pointerEvents: 'none',
                  zIndex: 10
                }}
              >
                {nick || 'Gość'}
              </div>
            )}

            <CanvasDraw
              ref={canvasRef}
              brushRadius={isErasing ? 10 : 3}
              brushColor={isErasing ? "#ffffff" : "#000000"}
              canvasWidth={400}
              canvasHeight={400}
              style={{
                border: '1px solid #ccc',
                backgroundColor: 'white'
              }}
            />
          </div>

          <h3>Zapisane rysunki:</h3>
          <div className="saved-drawings" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {drawings.map((d, i) => (
              <div key={i} style={{ border: '1px solid #ddd', padding: '10px' }}>
                <p><strong>{d.nick}</strong></p>
                <CanvasDraw
                  disabled
                  saveData={d.data}
                  immediateLoading={true}
                  canvasWidth={200}
                  canvasHeight={200}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="chat-section" style={{ flex: 1 }}>
          <h2>Czat</h2>

          <div className="chat-container" style={{
            height: '400px',
            border: '1px solid #ccc',
            padding: '10px',
            overflowY: 'auto',
            marginBottom: '10px'
          }}>
            {messages.map((m, i) => (
              <div key={i} style={{ marginBottom: '10px' }}>
                <strong>{m.nick}:</strong> {m.text}
              </div>
            ))}
          </div>

          <div className="chat-input" style={{ display: 'flex', marginBottom: '10px' }}>
            <input
              value={message}
              onChange={e => setMessage(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && sendMessage()}
              placeholder="Wpisz wiadomość"
              style={{ flex: 1, padding: '8px', marginRight: '10px' }}
            />
            <button
              onClick={sendMessage}
              style={{ padding: '8px 16px' }}
            >
              Wyślij
            </button>
          </div>

          <button
            onClick={downloadChat}
            style={{ padding: '8px 16px' }}
          >
            Pobierz chat
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
