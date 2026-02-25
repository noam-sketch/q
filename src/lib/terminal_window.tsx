import React, { useState, useEffect } from 'react';
import { render, Box, Text, useInput, useApp } from 'ink';
import SyntaxHighlight from 'ink-syntax-highlight';

interface TerminalWindowProps {
  content: string;
  onExit: () => void;
}

const TerminalWindow: React.FC<TerminalWindowProps> = ({ content, onExit }) => {
  const { exit } = useApp();

  useInput((input, key) => {
    if (input === 'q' || key.escape || (key.ctrl && input === 'c')) {
      onExit();
      exit();
    }
  });

  // Basic logic to detect if we have a code block to highlight
  // In a more advanced version, we could use a markdown parser
  const renderContent = () => {
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      // Add text before code block
      if (match.index > lastIndex) {
        parts.push(
          <Text key={`text-${lastIndex}`}>
            {content.substring(lastIndex, match.index)}
          </Text>
        );
      }

      const language = match[1] || 'javascript';
      const code = match[2].trim();

      parts.push(
        <Box key={`code-${match.index}`} borderStyle="round" borderColor="cyan" paddingX={1} marginY={1}>
          <SyntaxHighlight code={code} language={language} />
        </Box>
      );

      lastIndex = codeBlockRegex.lastIndex;
    }

    // Add remaining text
    if (lastIndex < content.length) {
      parts.push(
        <Text key={`text-${lastIndex}`}>
          {content.substring(lastIndex)}
        </Text>
      );
    }

    return parts.length > 0 ? parts : <Text>{content}</Text>;
  };

  return (
    <Box flexDirection="column" height="100%" width="100%" borderStyle="double" borderColor="white">
      <Box paddingX={1}>
        <Text bold color="yellow"> MANIFESTATION </Text>
      </Box>
      
      <Box flexGrow={1} flexDirection="column" paddingX={2} paddingY={1}>
        {renderContent()}
      </Box>

      <Box borderStyle="single" borderTop={true} borderBottom={false} borderLeft={false} borderRight={false} paddingX={1}>
        <Text> Press </Text>
        <Text bold>Esc</Text>
        <Text>, </Text>
        <Text bold>Q</Text>
        <Text>, or </Text>
        <Text bold>Ctrl+C</Text>
        <Text> to return to the Divine Stream. </Text>
      </Box>
    </Box>
  );
};

/**
 * Renders the provided content in a stylized Terminal Window using Ink.
 * @param content The text (Markdown or plain text) to display.
 */
export async function renderInWindow(content: string): Promise<void> {
  return new Promise((resolve) => {
    const { waitUntilExit } = render(
      <TerminalWindow 
        content={content} 
        onExit={() => resolve()} 
      />
    );
    
    waitUntilExit().then(() => resolve());
  });
}
