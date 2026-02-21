import React, { useState, useEffect, useCallback, useRef } from 'react';
import { qLocal } from '../lib/q_local_client';
import './Finder.css';

interface FileNode {
  name: string;
  path: string;
  isDirectory: boolean;
  isOpen: boolean;
  children: FileNode[];
  isLoaded: boolean;
  hash?: string;
}

const Finder: React.FC = () => {
  const [rootNode, setRootNode] = useState<FileNode | null>(null);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [previewContent, setPreviewContent] = useState<string>('');
  const [isDiffMode, setIsDiffMode] = useState<boolean>(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Ref for polling interval to watch directory changes
  const pollingRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchDirectory = async (dirPath: string): Promise<FileNode[]> => {
    try {
      const response = await qLocal.syncFractalTree(dirPath);
      const tree = response.tree;
      
      // The tree is the root of dirPath. We want its children.
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
      console.error(`Failed to read directory ${dirPath}:`, err);
      return [];
    }
  };

  const toggleNode = async (nodePath: string) => {
    if (!rootNode) return;

    const newRoot = { ...rootNode };

    const updateNode = async (current: FileNode): Promise<boolean> => {
      if (current.path === nodePath && current.isDirectory) {
        if (current.isOpen) {
          current.isOpen = false;
        } else {
          current.isOpen = true;
          if (!current.isLoaded) {
            current.children = await fetchDirectory(current.path);
            current.isLoaded = true;
          } else {
            // refresh children silently
            current.children = await fetchDirectory(current.path);
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

    await updateNode(newRoot);
    setRootNode(newRoot);
  };

  const selectFile = async (nodePath: string, isDirectory: boolean) => {
    setSelectedPath(nodePath);
    if (!isDirectory) {
      await loadPreview(nodePath);
    }
  };

  const loadPreview = async (filePath: string) => {
    setIsPreviewLoading(true);
    setPreviewContent('');
    setError(null);
    try {
      const mimeType = await qLocal.executeCommand(`file -b --mime-type "${filePath}"`);
      
      if (mimeType.trim().startsWith('image/')) {
        setPreviewContent(`[Image Preview Not Supported in terminal yet]\nMime Type: ${mimeType.trim()}`);
      } else {
        if (isDiffMode) {
           try {
             // check if inside git repo
             const dir = filePath.substring(0, filePath.lastIndexOf('/'));
             const isGit = await qLocal.executeCommand(`cd "${dir}" && git rev-parse --is-inside-work-tree || echo false`);
             if (isGit.trim() === 'true') {
               const diff = await qLocal.executeCommand(`cd "${dir}" && git diff HEAD -- "${filePath}"`);
               setPreviewContent(diff.trim() ? diff : '[No unsaved changes in Git]');
             } else {
               setPreviewContent('[Not a Git repository, Diff unavailable]');
             }
           } catch {
             setPreviewContent('[Error loading Git diff]');
           }
        } else {
           const output = await qLocal.executeCommand(`head -c 50000 "${filePath}"`);
           setPreviewContent(output);
        }
      }
    } catch (err: any) {
      console.error('Failed to load preview:', err);
      setError(`Error loading preview: ${err.message}`);
    } finally {
      setIsPreviewLoading(false);
    }
  };

  useEffect(() => {
    if (selectedPath && !selectedPath.endsWith('/')) {
      loadPreview(selectedPath);
    }
  }, [isDiffMode]);

  const initRoot = useCallback(async () => {
    if (!qLocal.isConnected()) return;
    try {
      const homePath = (await qLocal.executeCommand('pwd')).trim();
      const initialChildren = await fetchDirectory(homePath);
      
      setRootNode({
        name: homePath,
        path: homePath,
        isDirectory: true,
        isOpen: true,
        children: initialChildren,
        isLoaded: true
      });
    } catch (err: any) {
      console.error('Failed to initialize root:', err);
      setError('Failed to connect to local directory.');
    }
  }, []);

  // Set up polling for directory watcher
  useEffect(() => {
    if (!qLocal.isConnected() || !rootNode) return;
    
    // Poll the currently open directories every 5 seconds to sync state
    const pollWatcher = async () => {
       const newRoot = { ...rootNode };
       
       const refreshOpenNodes = async (node: FileNode) => {
          if (node.isOpen) {
             const response = await qLocal.syncFractalTree(node.path);
             const tree = response.tree;
             console.log(`[Consensus] Path: ${node.path} | Remote Hash: ${tree?.hash} | Local Hash: ${node.hash} | Latency: ${response.latencyMs}ms`);
             
             // Consensus mechanism: If hashes match, state is synchronized.
             if (tree && tree.hash === node.hash) {
                 return; 
             }
             
             // State transition: Hashes differ, update state partition.
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
                 
                 // Merge to keep open states of children
                 node.children = freshChildren.map((freshChild: FileNode) => {
                    const existingChild = node.children.find(c => c.path === freshChild.path);
                    if (existingChild) {
                       return { ...freshChild, isOpen: existingChild.isOpen, children: existingChild.children, isLoaded: existingChild.isLoaded };
                    }
                    return freshChild;
                 });
             }

             // Recurse to sync nested partitioned state
             for (const child of node.children) {
                if (child.isDirectory && child.isOpen) {
                   await refreshOpenNodes(child);
                }
             }
          }
       };

       await refreshOpenNodes(newRoot);
       setRootNode(newRoot);
    };

    pollingRef.current = setInterval(pollWatcher, 5000);
    
    return () => {
       if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [rootNode?.path]); // Dependency mainly on the root path existing

  useEffect(() => {
    if (qLocal.isConnected()) {
      initRoot();
    } else {
      qLocal.onConnectionChange((connected) => {
        if (connected) initRoot();
      });
    }
  }, [initRoot]);

  const renderTree = (nodes: FileNode[], level: number = 0) => {
    return (
      <ul className="finder-tree-list">
        {nodes.map(node => (
          <li key={node.path} className="finder-tree-item">
            <div 
              className={`finder-tree-row ${selectedPath === node.path ? 'selected' : ''}`}
              style={{ paddingLeft: `${level * 16 + 8}px` }}
              onClick={() => {
                if (node.isDirectory) {
                  toggleNode(node.path);
                } else {
                  selectFile(node.path, false);
                }
              }}
            >
              {node.isDirectory ? (
                <span className="finder-tree-toggle">
                  {node.isOpen ? '▼' : '▶'}
                </span>
              ) : (
                <span className="finder-tree-toggle-spacer" />
              )}
              <span className="finder-file-icon">
                {node.isDirectory ? (node.isOpen ? '📂' : '📁') : '📄'}
              </span>
              <span className="finder-file-name">{node.name}</span>
            </div>
            {node.isDirectory && node.isOpen && (
              <div className="finder-tree-children">
                {renderTree(node.children, level + 1)}
              </div>
            )}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="finder-container">
      <div className="finder-sidebar">
        <div className="finder-header">
          <div className="current-path" title={rootNode?.path || 'Loading...'}>
            {rootNode?.path || 'Q-Local Workspace'}
          </div>
          <button onClick={() => setIsDiffMode(!isDiffMode)} className={isDiffMode ? 'active-diff' : ''} title="Toggle Git Diff View">
            {isDiffMode ? 'Diff On' : 'Diff Off'}
          </button>
          <button onClick={initRoot} title="Refresh Tree">🔄</button>
        </div>
        
        <div className="finder-tree-container">
          {!rootNode ? (
             <div className="finder-loading">{error || 'Connecting to Q-Local...'}</div>
          ) : (
             renderTree(rootNode.children)
          )}
        </div>
      </div>
      
      <div className="finder-preview-pane">
        <div className="finder-preview-header">
          {selectedPath ? selectedPath.split('/').pop() : 'Preview'}
          {isDiffMode && selectedPath && <span className="diff-badge"> (Diff View)</span>}
        </div>
        
        {isPreviewLoading ? (
          <div className="finder-preview-empty">Loading preview...</div>
        ) : selectedPath ? (
          <div className="finder-preview-content">
            {error ? <span style={{color: 'red'}}>{error}</span> : previewContent}
          </div>
        ) : (
          <div className="finder-preview-empty">
            Select a file to preview
          </div>
        )}
      </div>
    </div>
  );
};

export default Finder;