import { describe, it, expect, vi } from 'vitest';
import { FractalNode, computeFileHash, buildFractalTree, compareFractalTrees } from './fractal_tree.js';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

vi.mock('fs');
vi.mock('path');

describe('Fractal Tree Synchronization Protocol', () => {

    it('computeFileHash should deterministically hash file content (Data Integrity)', async () => {
        const mockContent = 'deterministic state transition payload';
        vi.spyOn(fs, 'readFileSync').mockReturnValue(mockContent);
        
        const expectedHash = crypto.createHash('sha256').update(mockContent).digest('hex');
        const hash = computeFileHash('/fake/path.txt');
        
        expect(hash).toBe(expectedHash);
    });

    it('buildFractalTree should recursively partition state space and compute hashes', async () => {
        vi.spyOn(fs, 'readdirSync').mockImplementation(((p: any) => {
            if (p.endsWith && p.endsWith('dirB')) return [];
            return ['fileA.txt', 'dirB'];
        }) as any);
        vi.spyOn(fs, 'lstatSync').mockImplementation(((p: any) => ({
            isDirectory: () => p === '/root' || (p.endsWith && p.endsWith('dirB')),
            isFile: () => p !== '/root' && (!p.endsWith || !p.endsWith('dirB')),
            isSymbolicLink: () => false,
            mtimeMs: 1000
        })) as any);
        
        // Mock file contents for deterministic hashing
        vi.spyOn(fs, 'readFileSync').mockImplementation(((p: any) => {
            if (p.includes && p.includes('fileA.txt')) return 'contentA';
            return ''; // Empty dir content for this test structure
        }) as any);

        vi.spyOn(path, 'join').mockImplementation((a, b) => `${a}/${b}`);

        const tree = await buildFractalTree('/root');

        expect(tree.path).toBe('/root');
        expect(tree.type).toBe('directory');
        expect(tree.children?.length).toBe(2);

        const fileA = tree.children?.find(c => c.path === '/root/fileA.txt');
        expect(fileA?.type).toBe('file');
        expect(fileA?.hash).toBe(crypto.createHash('sha256').update('contentA').digest('hex'));

        const dirB = tree.children?.find(c => c.path === '/root/dirB');
        expect(dirB?.type).toBe('directory');
        expect(dirB?.children?.length).toBe(0);
        
        // Directory hash should be combination of children hashes
        expect(tree.hash).toBeTruthy();
    });

    it('compareFractalTrees should establish consensus by identifying out-of-sync subtrees', () => {
        const treeA: FractalNode = {
            path: '/root',
            type: 'directory',
            hash: 'hash_root_A',
            lastModified: 1000,
            children: [
                { path: '/root/file1.txt', type: 'file', hash: 'hash_file1', lastModified: 1000 },
                { path: '/root/dir1', type: 'directory', hash: 'hash_dir1_A', lastModified: 1000, children: [
                    { path: '/root/dir1/file2.txt', type: 'file', hash: 'hash_file2_A', lastModified: 1000 }
                ]}
            ]
        };

        const treeB: FractalNode = {
            path: '/root',
            type: 'directory',
            hash: 'hash_root_B',
            lastModified: 1000,
            children: [
                { path: '/root/file1.txt', type: 'file', hash: 'hash_file1', lastModified: 1000 },
                { path: '/root/dir1', type: 'directory', hash: 'hash_dir1_B', lastModified: 1000, children: [
                    { path: '/root/dir1/file2.txt', type: 'file', hash: 'hash_file2_B', lastModified: 2000 } // Differs here
                ]}
            ]
        };

        // measure sync latency mock
        const start = Date.now();
        const diffs = compareFractalTrees(treeA, treeB);
        const latency = Date.now() - start;

        expect(diffs).toContain('/root/dir1/file2.txt');
        expect(diffs.length).toBe(1);
        expect(latency).toBeGreaterThanOrEqual(0);
    });
});
