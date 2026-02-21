import React from 'react';

interface InformationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const InformationModal: React.FC<InformationModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content docs-content" onClick={(e) => e.stopPropagation()}>
        <h2>Q OS Documentation</h2>
        
        <div className="docs-section">
            <h3>Philosophy</h3>
            <p>
                <strong>Q</strong> acts as a bridge between the physical user (Carbon) and the system environment (Silicon).
            </p>
        </div>

        <div className="docs-section">
            <h3>Q-Local (Kernel Integration)</h3>
            <p>
                The Web Interface runs inside the browser sandbox. To grant the AI <strong>system-level execution access</strong> (File reads, Terminal execution, OS scripts), you must download and run the lightweight <strong>Q-Local Agent</strong>.
            </p>
            <div className="code-block" style={{ backgroundColor: '#000', padding: '10px', borderRadius: '4px', fontFamily: 'monospace', fontSize: '0.9em', margin: '10px 0', border: '1px solid #333' }}>
                <span style={{ color: '#666' }}>// For macOS or Linux, make the downloaded binary executable first:</span><br/>
                <code style={{ color: '#00ff00' }}>chmod +x q-local-[os]</code><br/>
                <code style={{ color: '#00ff00' }}>./q-local-[os]</code>
            </div>
            <p>
                Once running, the <span style={{ color: '#ff3333' }}>ISOLATED</span> indicator will turn <span style={{ color: '#00ff00' }}>ENTANGLED</span>, and the <code>!sys</code> command will become available in the terminal.
            </p>
            <p style={{ color: '#00e5ff', fontSize: '0.9em' }}>
                <em>Note: The AI models (Q and Bezalel) are fully aware of this bridge. They will instruct you to use <code>!sys</code> when they need to inspect your files or run commands, and they will read the results and latency measurements directly from the File Buffer Channel (FBC) to continue the conversation.</em>
            </p>
        </div>

        <div className="docs-section">
            <h3>Commands</h3>
            <ul style={{ color: '#ccc' }}>
                <li><code>help</code> : Display interactive help matrix.</li>
                <li><code>triad</code> : Toggle Triad Mode (Pro tier only).</li>
                <li><code>clear</code> : Clear the terminal buffer.</li>
                <li><code>!sys [cmd]</code> : Execute shell command on host (requires Q-Local). Results and execution latency are printed to the terminal and FBC. Example: <code>!sys whoami</code></li>
            </ul>
        </div>
        
        <div className="docs-section">
            <h3>Privacy &amp; Data</h3>
            <p>
                If you provide your own API Keys (via the Settings Cog), they are stored strictly in your browser&apos;s <code>localStorage</code>. They are <strong>never</strong> transmitted to our servers.
            </p>
        </div>

        <div className="modal-actions">
          <button className="btn-save" onClick={onClose}>Understood</button>
        </div>
      </div>
    </div>
  );
};

export default InformationModal;