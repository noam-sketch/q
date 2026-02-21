import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

export interface FractalNode {
    path: string;
    type: 'file' | 'directory';
    hash: string;
    lastModified: number;
    children?: FractalNode[];
}

const IGNORED_DIRS = new Set(['node_modules', '.git', 'dist', 'build', 'coverage', '.cache', '.npm', '.ollama', '.rustup', '.cargo', '.m2']);
const IGNORED_PREFIXES = ['.', 'untitled folder']; // Ignore hidden files or weird folders if needed, but let's just use the strict set for now.

export function computeFileHash(filePath: string): string {
    try {
        const content = fs.readFileSync(filePath);
        return crypto.createHash('sha256').update(content).digest('hex');
    } catch {
        return 'unreadable';
    }
}

export async function buildFractalTree(currentPath: string, depth: number = 0): Promise<FractalNode> {
    // Prevent infinite recursion or absurdly deep trees
    if (depth > 15) {
         return {
            path: currentPath,
            type: 'directory',
            hash: 'max_depth_reached',
            lastModified: 0,
            children: []
        };
    }

    try {
        const stats = fs.lstatSync(currentPath);

        // Skip symlinks to avoid infinite loops
        if (stats.isSymbolicLink()) {
             return {
                path: currentPath,
                type: 'file',
                hash: 'symlink',
                lastModified: stats.mtimeMs,
            };
        }

        if (stats.isFile()) {
            return {
                path: currentPath,
                type: 'file',
                hash: computeFileHash(currentPath),
                lastModified: stats.mtimeMs,
            };
        } else if (stats.isDirectory()) {
            const dirName = path.basename(currentPath);
            if (IGNORED_DIRS.has(dirName)) {
                 return {
                    path: currentPath,
                    type: 'directory',
                    hash: 'ignored',
                    lastModified: stats.mtimeMs,
                    children: [],
                };
            }

            let childrenNames: string[] = [];
            try {
                childrenNames = fs.readdirSync(currentPath);
            } catch {
                // Cannot read directory
            }
            
            const childrenNodes: FractalNode[] = [];

            for (const childName of childrenNames) {
                // Also optionally skip hidden files/dirs if desired, but for a dev tool we might want them.
                // We'll skip Mac specific stuff like .Trashes
                if (childName === '.Trash' || childName === '.Trashes') continue;
                
                const childPath = path.join(currentPath, childName);
                childrenNodes.push(await buildFractalTree(childPath, depth + 1));
            }

            // Deterministic sorting to ensure consistent hash
            childrenNodes.sort((a, b) => a.path.localeCompare(b.path));

            const hashInput = childrenNodes.map(c => c.hash).join('|');
            const hash = crypto.createHash('sha256').update(hashInput).digest('hex');

            return {
                path: currentPath,
                type: 'directory',
                hash,
                lastModified: stats.mtimeMs,
                children: childrenNodes,
            };
        }
        
        return {
             path: currentPath,
             type: 'file',
             hash: 'unsupported',
             lastModified: 0,
        };
    } catch {
        return {
            path: currentPath,
            type: 'file',
            hash: 'error',
            lastModified: 0,
        };
    }
}

export function compareFractalTrees(nodeA: FractalNode, nodeB: FractalNode): string[] {
    const diffs: string[] = [];

    // If both are files and hashes mismatch, there is a diff
    if (nodeA.type === 'file' && nodeB.type === 'file') {
        if (nodeA.hash !== nodeB.hash) {
            diffs.push(nodeA.path);
        }
        return diffs;
    }

    // If directory hashes match perfectly, the entire subtree is in sync.
    // This is the core efficiency of the fractal tree synchronization protocol.
    if (nodeA.hash === nodeB.hash) {
        return diffs;
    }

    // If hashes differ, we must inspect children.
    // If structural type differs (file vs dir), mark as diff
    if (nodeA.type !== nodeB.type) {
        diffs.push(nodeA.path);
        return diffs;
    }

    // Both are directories but have different hashes, compare children
    const childrenA = nodeA.children || [];
    const childrenB = nodeB.children || [];

    const mapA = new Map(childrenA.map(c => [c.path, c]));
    const mapB = new Map(childrenB.map(c => [c.path, c]));

    // Check all nodes in A
    for (const [childPath, childA] of mapA.entries()) {
        const childB = mapB.get(childPath);
        if (!childB) {
            // Node exists in A but not in B
            diffs.push(childPath);
        } else {
            // Node exists in both, recurse
            diffs.push(...compareFractalTrees(childA, childB));
        }
    }

    // Check all nodes in B that were not in A
    for (const childPath of mapB.keys()) {
        if (!mapA.has(childPath)) {
            diffs.push(childPath);
        }
    }

    return diffs;
}
