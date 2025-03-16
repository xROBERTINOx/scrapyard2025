(function() {
    // Wait for the page to fully load
    window.addEventListener('load', function() {
      setTimeout(createWheelButton, 2000); // Give YouTube time to fully render
    });
  
    function createWheelButton() {
      // Create wheel button
      const wheelButton = document.createElement('button');
      wheelButton.textContent = '🎡 Spin the Wheel';
      wheelButton.id = 'youtube-wheel-button';
      wheelButton.addEventListener('click', showWheel);
      
      // Insert button into YouTube header
      const header = document.querySelector('#masthead #end');
      if (header) {
        header.prepend(wheelButton);
      }
    }
  
    function showWheel() {
      // Create modal backdrop
      const modal = document.createElement('div');
      modal.id = 'youtube-wheel-modal';
      
      // Create wheel container
      const wheelContainer = document.createElement('div');
      wheelContainer.id = 'youtube-wheel-container';
      
      // Get video data from the page
      const videos = collectVideosFromPage();
      
      console.log("Found videos:", videos.length);
      
      if (videos.length < 3) {
        alert('Not enough videos found on the page. Scroll down to load more videos.');
        return;
      }
      
      // Create canvas for the wheel
      const canvas = document.createElement('canvas');
      canvas.id = 'youtube-wheel-canvas';
      canvas.width = 500;
      canvas.height = 500;
      wheelContainer.appendChild(canvas);
      
      // Create spin button
      const spinButton = document.createElement('button');
      spinButton.textContent = 'SPIN';
      spinButton.id = 'youtube-wheel-spin';
      wheelContainer.appendChild(spinButton);
      
      // Add close button
      const closeButton = document.createElement('button');
      closeButton.textContent = '✕';
      closeButton.id = 'youtube-wheel-close';
      closeButton.addEventListener('click', () => {
        document.body.removeChild(modal);
      });
      wheelContainer.appendChild(closeButton);
      
      // Append elements to the DOM
      modal.appendChild(wheelContainer);
      document.body.appendChild(modal);
      
      // Initialize the wheel
      initWheel(canvas, spinButton, videos);
    }
    
    function collectVideosFromPage() {
      const videos = [];
      
      // Try multiple selectors to find videos
      const selectors = [
        'ytd-rich-item-renderer',
        'ytd-grid-video-renderer',
        'ytd-video-renderer',
        'ytd-compact-video-renderer',
        'ytd-shelf-renderer'
      ];
      
      // Find all video elements with any of the selectors
      const videoElements = document.querySelectorAll(selectors.join(', '));
      
      videoElements.forEach(element => {
        // Multiple ways to find the video link
        const titleElement = element.querySelector('#video-title, a#video-title, a.yt-simple-endpoint');
        
        if (titleElement && titleElement.href && titleElement.href.includes('/watch?v=')) {
          const title = titleElement.textContent.trim();
          const url = titleElement.href;
          
          // Only add if it's a valid YouTube video URL and we have a title
          if (title && url) {
            videos.push({
              title: title,
              url: url,
              thumbnail: ''
            });
          }
        }
      });
      
      // If we still don't have videos, try a more general approach
      if (videos.length < 3) {
        const allLinks = document.querySelectorAll('a');
        allLinks.forEach(link => {
          if (link.href && link.href.includes('/watch?v=')) {
            const title = link.textContent.trim() || link.getAttribute('title') || 'Video';
            if (title && !videos.some(v => v.url === link.href)) {
              videos.push({
                title: title,
                url: link.href,
                thumbnail: ''
              });
            }
          }
        });
      }
      
      return videos;
    }
    
    function initWheel(canvas, spinButton, videos) {
      const ctx = canvas.getContext('2d');
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = Math.min(centerX, centerY) - 10;
      
      // Set up wheel segments
      const segments = videos.map(video => {
        // Limit title length to prevent overflow
        const shortTitle = video.title.length > 20 ? video.title.substring(0, 20) + '...' : video.title;
        return shortTitle;
      });
      
      const segColors = generateColors(segments.length);
      let rotation = 0;
      let rotating = false;
      
      // Draw the initial wheel
      drawWheel();
      
      // Handle spin button click
      spinButton.addEventListener('click', () => {
        if (!rotating) {
          rotating = true;
          spinButton.disabled = true;
          const stopAngle = Math.random() * Math.PI * 2;
          const duration = 5000; // 5 seconds
          const startTime = performance.now();
          
          // Animation function
          function rotateWheel(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function for slowing down the wheel
            const easeOut = 1 - Math.pow(1 - progress, 3);
            rotation = progress * 10 * Math.PI + stopAngle;
            
            drawWheel();
            
            if (progress < 1) {
              requestAnimationFrame(rotateWheel);
            } else {
              // Get selected video
              const segmentAngle = (Math.PI * 2) / segments.length;
              const normalizedRotation = (rotation % (Math.PI * 2));
              const selectedIndex = segments.length - 1 - Math.floor(normalizedRotation / segmentAngle);
              const adjustedIndex = selectedIndex % segments.length;
              
              // Show selected video
              const selectedVideo = videos[adjustedIndex];
            //   alert(`Selected: ${selectedVideo.title}`);
              
              // Navigate to the selected video
              setTimeout(() => {
                window.location.href = selectedVideo.url;
              }, 1000);
            }
          }
          
          requestAnimationFrame(rotateWheel);
        }
      });
      
      function drawWheel() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw segments
        const segmentAngle = (Math.PI * 2) / segments.length;
        
        for (let i = 0; i < segments.length; i++) {
          const startAngle = i * segmentAngle + rotation;
          const endAngle = (i + 1) * segmentAngle + rotation;
          
          ctx.beginPath();
          ctx.moveTo(centerX, centerY);
          ctx.arc(centerX, centerY, radius, startAngle, endAngle);
          ctx.closePath();
          
          ctx.fillStyle = segColors[i];
          ctx.fill();
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 2;
          ctx.stroke();
          
          // Draw text
          ctx.save();
          ctx.translate(centerX, centerY);
          ctx.rotate(startAngle + segmentAngle / 2);
          ctx.textAlign = 'right';
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 12px Arial';
          ctx.fillText(segments[i], radius - 10, 5);
          ctx.restore();
        }
        
        // Draw center circle
        ctx.beginPath();
        ctx.arc(centerX, centerY, 20, 0, Math.PI * 2);
        ctx.fillStyle = '#333';
        ctx.fill();
        
        // Draw pointer
        ctx.beginPath();
        ctx.moveTo(centerX, centerY - radius - 10);
        ctx.lineTo(centerX - 10, centerY - radius + 10);
        ctx.lineTo(centerX + 10, centerY - radius + 10);
        ctx.closePath();
        ctx.fillStyle = 'red';
        ctx.fill();
      }
      
      function generateColors(count) {
        const colors = [];
        for (let i = 0; i < count; i++) {
          const hue = (i * 360 / count) % 360;
          colors.push(`hsl(${hue}, 70%, 50%)`);
        }
        return colors;
      }
    }
  })();
  