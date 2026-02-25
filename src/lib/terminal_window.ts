import blessed from 'blessed';

/**
 * Renders the provided content in a stylized Terminal Window.
 * @param content The text (Markdown or plain text) to display.
 */
export async function renderInWindow(content: string): Promise<void> {
  const screen = blessed.screen({
    smartCSR: true,
    title: 'Kinetic Window - Q',
    // Ensures we don't clear the entire terminal history if possible,
    // although blessed typically takes over the TTY.
    fullUnicode: true,
  });

  const box = blessed.box({
    top: 'center',
    left: 'center',
    width: '80%',
    height: '80%',
    content: content,
    scrollable: true,
    alwaysScroll: true,
    keys: true,
    vi: true,
    mouse: true,
    tags: true, // Allow blessed-style tags {bold}text{/bold}
    border: {
      type: 'line',
    },
    style: {
      fg: 'white',
      border: {
        fg: '#f0f0f0',
      },
      scrollbar: {
        bg: 'blue'
      }
    },
    label: ' {bold}MANIFESTATION{/bold} '
  });

  screen.append(box);

  // Help footer
  const footer = blessed.box({
    bottom: 0,
    left: 0,
    width: '100%',
    height: 1,
    content: ' Press {bold}Esc{/bold}, {bold}Q{/bold}, or {bold}Ctrl+C{/bold} to return to the Divine Stream. ',
    tags: true,
    style: {
      fg: 'white',
      bg: 'black'
    }
  });
  screen.append(footer);

  box.focus();

  return new Promise((resolve) => {
    const exitKeys = ['escape', 'q', 'C-c'];
    
    screen.key(exitKeys, () => {
      screen.destroy();
      resolve();
    });

    screen.render();
  });
}
