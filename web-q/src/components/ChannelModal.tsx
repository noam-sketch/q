import React, { useEffect, useState, useCallback, useRef } from 'react';
import { UnifiedFBCService } from '../lib/browser_fbc';
import { qLocal } from '../lib/q_local_client';

interface ChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectChannel: (channelName: string) => void;
}

interface FbcNode {
  name: string;
  path: string;
  isDirectory: boolean;
  isOpen: boolean;
  children: FbcNode[];
  isLoaded: boolean;
  hash?: string;
}

const fbc = new UnifiedFBCService();

const ChannelModal: React.FC<ChannelModalProps> = ({ isOpen, onClose, onSelectChannel }) => {
  const [opfsChannels, setOpfsChannels] = useState<string[]>([]);
  const [newChannelName, setNewChannelName] = useState('');
  
  // Fractal Forest State
  const [fbcForest, setFbcForest] = useState<FbcNode | null>(null);
  const [isLoadingForest, setIsLoadingForest] = useState<boolean>(false);
  const [forestError, setForestError] = useState<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchFbcTree = async (dirPath: string): Promise<FbcNode[]> => {
    try {
      const response = await qLocal.syncFractalTree(dirPath);
      const tree = response.tree;
      
      if (!tree || tree.type !== 'directory' || !tree.children) return [];

      return tree.children.map((child: any) => ({
        name: child.path.split('/').pop() || '',
        path: child.path,
        isDirectory: child.type === 'directory',
        isOpen: false,
        children: [],
        isLoaded: false,
        hash: child.hash
      }));
    } catch (err: any) {
      console.error(`Failed to read FBC directory ${dirPath}:`, err);
      return [];
    }
  };

  const initForest = useCallback(async () => {
    if (!qLocal.isConnected()) return;
    setIsLoadingForest(true);
    setForestError(null);
    try {
      // Ensure fbc directory exists
      await qLocal.executeCommand('mkdir -p ./fbc');
      const rootPath = (await qLocal.executeCommand('cd ./fbc && pwd')).trim();
      const initialChildren = await fetchFbcTree(rootPath);
      
      setFbcForest({
        name: 'FBC Forest',
        path: rootPath,
        isDirectory: true,
        isOpen: true,
        children: initialChildren,
        isLoaded: true
      });
    } catch (err: any) {
      console.error('Failed to initialize FBC Forest:', err);
      setForestError('Failed to sync FBC Forest from Q-Local.');
    } finally {
      setIsLoadingForest(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      if (qLocal.isConnected()) {
          initForest();
      } else {
          fbc.listChannels().then(setOpfsChannels).catch(console.error);
      }
    }
  }, [isOpen, initForest]);

  // Consensus mechanism for the FBC Forest
  useEffect(() => {
    if (!isOpen || !qLocal.isConnected() || !fbcForest) return;
    
    const pollWatcher = async () => {
       const newForest = { ...fbcForest };
       
       const refreshOpenNodes = async (node: FbcNode) => {
          if (node.isOpen) {
             try {
                 const response = await qLocal.syncFractalTree(node.path);
                 const tree = response.tree;
                 
                 if (tree && tree.hash === node.hash) {
                     return; 
                 }
                 
                 if (tree && tree.children) {
                     node.hash = tree.hash;
                     const freshChildren = tree.children.map((child: any) => ({
                        name: child.path.split('/').pop() || '',
                        path: child.path,
                        isDirectory: child.type === 'directory',
                        isOpen: false,
                        children: [],
                        isLoaded: false,
                        hash: child.hash
                     }));
                     
                     node.children = freshChildren.map((freshChild: FbcNode) => {
                        const existingChild = node.children.find(c => c.path === freshChild.path);
                        if (existingChild) {
                           return { ...freshChild, isOpen: existingChild.isOpen, children: existingChild.children, isLoaded: existingChild.isLoaded };
                        }
                        return freshChild;
                     });
                 }
             } catch (e) {
                 console.error('Forest consensus poll failed for node', node.path, e);
             }

             for (const child of node.children) {
                if (child.isDirectory && child.isOpen) {
                   await refreshOpenNodes(child);
                }
             }
          }
       };

       await refreshOpenNodes(newForest);
       setFbcForest(newForest);
    };

    pollingRef.current = setInterval(pollWatcher, 3000);
    
    return () => {
       if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [isOpen, fbcForest?.path]);

  if (!isOpen) return null;

  const handleCreate = async () => {
    if (newChannelName.trim()) {
      const name = newChannelName.trim().endsWith('.md') 
          ? newChannelName.trim() 
          : `${newChannelName.trim()}.md`;
      
      if (qLocal.isConnected()) {
          // If connected, create in the root of the FBC forest
          await qLocal.executeCommand(`touch "./fbc/${name}"`);
          // Note: The polling watcher will pick this up automatically, 
          // but we can manually refresh the root or just navigate to it.
      }
      
      onSelectChannel(name);
      setNewChannelName('');
    }
  };

  const handleSelect = (channelPath: string) => {
      onSelectChannel(channelPath);
      onClose();
  };

  const handleClearCurrent = async () => {
      if(window.confirm('Are you sure you want to clear the current File Buffer Channel? This cannot be undone.')){
          if (qLocal.isConnected()) {
             // In local mode we don't know the exact active channel path here easily without global state,
             // so we might need a different UI flow for clearing specific fractal nodes.
             alert('In FBC Forest mode, please clear channels manually using the shell or Finder.');
          } else {
             await fbc.clear();
             onClose();
             onSelectChannel(fbc.getFilename());
          }
      }
  };

  const toggleNode = async (nodePath: string) => {
    if (!fbcForest) return;
    const newForest = { ...fbcForest };

    const updateNode = async (current: FbcNode): Promise<boolean> => {
      if (current.path === nodePath && current.isDirectory) {
        if (current.isOpen) {
          current.isOpen = false;
        } else {
          current.isOpen = true;
          if (!current.isLoaded) {
            current.children = await fetchFbcTree(current.path);
            current.isLoaded = true;
          } else {
            current.children = await fetchFbcTree(current.path);
          }
        }
        return true;
      }
      if (current.isOpen && current.children) {
        for (const child of current.children) {
          if (await updateNode(child)) return true;
        }
      }
      return false;
    };

    await updateNode(newForest);
    setFbcForest(newForest);
  };

  const renderTree = (nodes: FbcNode[], level: number = 0) => {
    return (
      <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {nodes.map(node => (
          <li key={node.path}>
            <div 
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '8px',
                paddingLeft: `${level * 16 + 8}px`,
                cursor: 'pointer',
                borderBottom: '1px solid #222',
                backgroundColor: '#111',
                color: '#fff',
                fontFamily: 'monospace',
                fontSize: '0.9em'
              }}
              onClick={() => {
                if (node.isDirectory) {
                  toggleNode(node.path);
                } else {
                  handleSelect(node.path);
                }
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#222'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#111'}
            >
              {node.isDirectory ? (
                <span style={{ width: '20px', display: 'inline-block', opacity: 0.6 }}>
                  {node.isOpen ? '▼' : '▶'}
                </span>
              ) : (
                <span style={{ width: '20px', display: 'inline-block' }} />
              )}
              <span style={{ marginRight: '8px', opacity: 0.8 }}>
                {node.isDirectory ? (node.isOpen ? '📂' : '📁') : '📄'}
              </span>
              <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {node.name}
              </span>
            </div>
            {node.isDirectory && node.isOpen && (
              <div>
                {renderTree(node.children, level + 1)}
              </div>
            )}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2 style={{ margin: '0 0 5px 0', color: '#00e5ff' }}>
            {qLocal.isConnected() ? 'FBC Forest Navigation' : 'FBC Navigation'}
        </h2>
        <p style={{ color: '#aaa', fontSize: '0.9em', margin: '0 0 20px 0' }}>
            {qLocal.isConnected() 
                ? 'Fractal protocol active. Browse synchronized File Buffer Channels.' 
                : 'Select or create a new File Buffer Channel to branch your cognitive stream.'}
        </p>

        <div className="form-group" style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <input 
              style={{ flex: 1, padding: '10px', borderRadius: '4px', border: '1px solid #333', background: '#000', color: '#00ff00', fontFamily: 'monospace' }}
              type="text" 
              placeholder={qLocal.isConnected() ? "New channel in root... (e.g. branch.md)" : "New Channel Name..."}
              value={newChannelName}
              onChange={(e) => setNewChannelName(e.target.value)}
              onKeyDown={(e) => {
                  if(e.key === 'Enter') {
                      e.preventDefault();
                      handleCreate();
                  }
              }}
            />
            <button className="btn-save" onClick={handleCreate} style={{ whiteSpace: 'nowrap', background: '#00e5ff', color: '#000' }}>Create</button>
        </div>

        <div style={{ margin: '20px 0', maxHeight: '300px', overflowY: 'auto', border: '1px solid #333', borderRadius: '4px', backgroundColor: '#000' }}>
            {qLocal.isConnected() ? (
                isLoadingForest ? (
                    <div style={{ padding: '20px', color: '#666', fontFamily: 'monospace', textAlign: 'center' }}>Synchronizing FBC Forest...</div>
                ) : forestError ? (
                    <div style={{ padding: '20px', color: 'red', fontFamily: 'monospace', textAlign: 'center' }}>{forestError}</div>
                ) : fbcForest?.children && fbcForest.children.length > 0 ? (
                    renderTree(fbcForest.children)
                ) : (
                    <div style={{ padding: '20px', color: '#666', fontFamily: 'monospace', textAlign: 'center' }}>FBC Forest is empty.</div>
                )
            ) : (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {opfsChannels.length === 0 && <li style={{ padding: '20px', color: '#666', fontFamily: 'monospace', textAlign: 'center' }}>No OPFS channels found.</li>}
                    {opfsChannels.map(channel => (
                        <li key={channel}>
                            <button 
                                style={{ width: '100%', textAlign: 'left', padding: '10px', backgroundColor: '#111', border: 'none', borderBottom: '1px solid #222', color: '#fff', cursor: 'pointer', fontFamily: 'monospace', fontSize: '0.9em' }}
                                onClick={() => handleSelect(channel)}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#222'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#111'}
                            >
                                📄 {channel} {fbc.getFilename() === channel ? <span style={{ color: '#00ff00', float: 'right' }}>(Active)</span> : ''}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>

        <div className="modal-actions" style={{ justifyContent: 'space-between', marginTop: '20px', borderTop: '1px solid #333', paddingTop: '20px' }}>
          {!qLocal.isConnected() && (
             <button className="btn-cancel" style={{ color: '#ff3333', background: 'transparent', border: '1px solid #ff3333' }} onClick={handleClearCurrent}>Clear FBC</button>
          )}
          <div style={{flex: 1}}></div>
          <button className="btn-cancel" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default ChannelModal;