// JavaScript for Chat Interface
// This file handles user interactions, form submissions, and API communication

// Wait for page to fully load before running code
document.addEventListener('DOMContentLoaded', () => {
  // Get references to important HTML elements by their IDs
  const form = document.getElementById('composer');        // The input form at bottom
  const input = document.getElementById('composerInput');  // Text input field
  const sendBtn = document.getElementById('sendBtn');      // Send button
  const youText = document.getElementById('youText');      // First "you" textarea
  const answerText = document.getElementById('answerText'); // First "answer" textarea
  const messages = document.getElementById('messages');    // Container for all messages

  // Safety check: if any required element is missing, stop execution
  // This prevents errors if HTML structure changes
  if (!form || !input || !sendBtn || !youText || !answerText || !messages) return;

  // Track how many messages have been sent
  // First message (0) uses the existing textareas, subsequent ones create new pairs
  let messageCount = 0;

  // HELPER FUNCTION: Create new message pair for subsequent messages
  function appendMessagePair(youValue, answerValue, loadingElement) {
    // Create "you" section with label and textarea
    const youSection = document.createElement('section');
    youSection.className = 'message you';           // Apply CSS styling
    
    const youLabel = document.createElement('div');
    youLabel.className = 'label';
    youLabel.textContent = 'you:';                  // Label text
    
    const youArea = document.createElement('textarea');
    youArea.className = 'message-box';              // Apply CSS styling
    youArea.readOnly = true;                        // Prevent editing
    youArea.value = youValue || '';                 // Set the message text

    // Assemble the "you" section
    youSection.appendChild(youLabel);
    youSection.appendChild(youArea);

    // Create "answer" section with label and textarea
    const ansSection = document.createElement('section');
    ansSection.className = 'message answer';        // Apply CSS styling
    
    const ansLabel = document.createElement('div');
    ansLabel.className = 'label';
    ansLabel.textContent = 'answer:';               // Label text
    
    const ansArea = document.createElement('textarea');
    ansArea.className = 'message-box';              // Apply CSS styling
    ansArea.readOnly = true;                        // Prevent editing
    ansArea.value = answerValue || '';              // Set the response text

    // Assemble the "answer" section
    ansSection.appendChild(ansLabel);
    ansSection.appendChild(ansArea);

    // Add both sections to the page
    messages.appendChild(youSection);
    
    // Remove loading indicator if it exists (cleanup)
    if (loadingElement) {
      loadingElement.remove();
    }
    
    messages.appendChild(ansSection);
    
    // Automatically scroll to bottom to show new message
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  }

  // MAIN EVENT HANDLER: Form submission
  // This runs when user presses Enter or clicks Send button
  form.addEventListener('submit', async (e) => {
    // Prevent default form submission (which would reload the page)
    e.preventDefault();
    
    // Get user's message and remove extra whitespace
    const text = input.value.trim();
    if (!text) return;  // Don't send empty messages

    // Disable send button to prevent multiple submissions
    sendBtn.disabled = true;

    // Create loading indicator element
    const loadingMsg = document.createElement('h1');
    loadingMsg.className = 'temporary_h1';              // Apply CSS styling
    loadingMsg.textContent = 'Analyzing! Response will be given soon';

    try {
      // PHASE 1: Show user message and loading indicator
      
      if (messageCount === 0) {
        // First message: use the existing HTML textareas
        youText.value = text;                     // Show user's message
        answerText.value = '';                    // Clear answer field
        
        // Insert loading indicator between existing you/answer sections
        const answerSection = answerText.closest('.message.answer');
        answerSection.parentNode.insertBefore(loadingMsg, answerSection);
        
      } else {
        // Subsequent messages: create new message pair
        const youSection = document.createElement('section');
        youSection.className = 'message you';
        
        const youLabel = document.createElement('div');
        youLabel.className = 'label';
        youLabel.textContent = 'you:';
        
        const youArea = document.createElement('textarea');
        youArea.className = 'message-box';
        youArea.readOnly = true;
        youArea.value = text;                     // Show user's message

        // Assemble and add to page
        youSection.appendChild(youLabel);
        youSection.appendChild(youArea);
        messages.appendChild(youSection);
        
        // Add loading indicator after the user message
        messages.appendChild(loadingMsg);
      }

      // Scroll to bottom to show new content
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });

      // PHASE 2: Send message to AI and get response
      
      // Make HTTP POST request to Flask API
      const res = await fetch('/api/send', {
        method: 'POST',                                    // POST request
        headers: { 'Content-Type': 'application/json' },  // Tell server we're sending JSON
        body: JSON.stringify({ text })                     // Convert JavaScript object to JSON string
      });
      
      // Parse JSON response from server
      const data = await res.json();
      const answer = data.answer || 'read';               // Extract answer, fallback to 'read'

      // PHASE 3: Remove loading indicator and show AI response
      
      loadingMsg.remove();  // Remove the "Analyzing..." message

      if (messageCount === 0) {
        // First message: use existing answer textarea
        answerText.value = answer;
        
      } else {
        // Subsequent messages: create new answer section
        const ansSection = document.createElement('section');
        ansSection.className = 'message answer';
        
        const ansLabel = document.createElement('div');
        ansLabel.className = 'label';
        ansLabel.textContent = 'answer:';
        
        const ansArea = document.createElement('textarea');
        ansArea.className = 'message-box';
        ansArea.readOnly = true;
        ansArea.value = answer;                           // Show AI's response

        // Assemble and add to page
        ansSection.appendChild(ansLabel);
        ansSection.appendChild(ansArea);
        messages.appendChild(ansSection);
      }

      // Increment counter for next message
      messageCount += 1;
      
      // Scroll to bottom to show AI response
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    } catch (err) {
      // ERROR HANDLING: If API call fails
      
      // Clean up loading indicator
      if (loadingMsg.parentNode) {
        loadingMsg.remove();
      }

      // Show error message to user
      if (messageCount === 0) {
        youText.value = text;
        answerText.value = 'Error occurred';
      } else {
        appendMessagePair(text, 'Error occurred');
      }
      messageCount += 1;
      
    } finally {
      // CLEANUP: This runs whether request succeeded or failed
      
      sendBtn.disabled = false;  // Re-enable send button
      input.value = '';          // Clear input field
      input.focus();             // Put cursor back in input for next message
    }
  });
});

// HOW THE FLOW WORKS:
// 1. User types message and presses Enter/Send
// 2. JavaScript shows user's message and "Analyzing..." loading indicator
// 3. JavaScript sends HTTP POST to Flask server at /api/send
// 4. Flask calls AI model (or returns 'read' fallback)
// 5. JavaScript receives response and shows AI's answer
// 6. Loading indicator disappears, ready for next message
