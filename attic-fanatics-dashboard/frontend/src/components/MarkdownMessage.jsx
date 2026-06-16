import React from 'react';
import ReactMarkdown from 'react-markdown';

export default function MarkdownMessage({ content }) {
  return (
    <div className="forge-prose">
      <ReactMarkdown
        components={{
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            if (!inline) {
              return (
                <pre>
                  {match && (
                    <div style={{
                      fontSize: '0.7rem', color: '#6b7280',
                      marginBottom: '0.5rem', fontFamily: 'monospace',
                      textTransform: 'uppercase', letterSpacing: '0.05em',
                    }}>
                      {match[1]}
                    </div>
                  )}
                  <code {...props}>{children}</code>
                </pre>
              );
            }
            return <code {...props}>{children}</code>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
