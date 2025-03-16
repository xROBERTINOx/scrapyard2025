(function() {
    // Wait for page to load and YouTube content to render
    window.addEventListener('load', function() {
      setTimeout(initializeWheel, 2000);
    });
  
    function initializeWheel() {
      // Only run on YouTube homepage
      if (window.location.pathname !== '/' && window.location.pathname !== '/feed/subscriptions') {
        return;
      }
  
      // Collect videos before modifying the page
      const videos = collectVideosFromPage(16); // Limit to 16 videos
      
      if (videos.length < 4) {
        console.error("Not enough videos found on the page");
        return;
      }
      
      // Store original content
      const primaryContent = document.querySelector('ytd-browse');
      
      // Create wheel container
      const wheelContainer = document.createElement('div');
      wheelContainer.id = 'yt-giant-wheel-container';
      
      // Create canvas for the wheel
      const canvas = document.createElement('canvas');
      canvas.id = 'yt-giant-wheel-canvas';
      canvas.width = 800;
      canvas.height = 800;
      wheelContainer.appendChild(canvas);
      
      // Create spin button
      const spinButton = document.createElement('button');
      spinButton.textContent = 'SPIN THE WHEEL';
      spinButton.id = 'yt-giant-wheel-spin';
      wheelContainer.appendChild(spinButton);
      
      // Create reset button to restore YouTube homepage
      const resetButton = document.createElement('button');
      resetButton.textContent = 'Back to YouTube';
      resetButton.id = 'yt-giant-wheel-reset';
      resetButton.addEventListener('click', function() {
        // Instead of trying to manipulate the DOM, just reload the page
        window.location.reload();
      });
      wheelContainer.appendChild(resetButton);
      
      // Insert the wheel after the header
      const header = document.querySelector('ytd-masthead');
      if (header && header.parentNode) {
        // Hide all YouTube content elements except header
        const contentElements = document.querySelectorAll('ytd-browse, ytd-two-column-browse-results-renderer, ytd-page-manager');
        contentElements.forEach(el => {
          if (el) {
            el.style.display = 'none';
          }
        });
        
        header.parentNode.insertBefore(wheelContainer, header.nextSibling);
      } else {
        document.body.appendChild(wheelContainer);
      }
      
      // Load thumbnails and initialize the wheel
      loadThumbnails(videos, function() {
        initWheel(canvas, spinButton, videos);
      });
    }
    
    function collectVideosFromPage(maxVideos) {
      const videos = [];
      
      // Try multiple selectors to find videos
      const selectors = [
        'ytd-rich-item-renderer',
        'ytd-grid-video-renderer',
        'ytd-video-renderer',
        'ytd-compact-video-renderer'
      ];
      
      // Find all video elements with any of the selectors
      const videoElements = document.querySelectorAll(selectors.join(', '));
      
      for (let element of videoElements) {
        if (videos.length >= maxVideos) break;
        
        // Find the video link
        const titleElement = element.querySelector('#video-title, a#video-title, a.yt-simple-endpoint');
        const thumbnailElement = element.querySelector('img#img, img.yt-core-image');
        
        if (titleElement && titleElement.href && titleElement.href.includes('/watch?v=')) {
          const title = titleElement.textContent.trim();
          const url = titleElement.href;
          const thumbnailUrl = thumbnailElement ? thumbnailElement.src : null;
          
          // Only add if it's a valid YouTube video URL and we have a title
          if (title && url && thumbnailUrl) {
            videos.push({
              title: title,
              url: url,
              thumbnailUrl: thumbnailUrl,
              thumbnailImg: null // Will be loaded later
            });
          }
        }
      }
      
      return videos;
    }
    
    function loadThumbnails(videos, callback) {
      let loadedCount = 0;
      
      videos.forEach(video => {
        if (video.thumbnailUrl) {
          const img = new Image();
          img.crossOrigin = "Anonymous";
          img.onload = function() {
            video.thumbnailImg = img;
            loadedCount++;
            if (loadedCount === videos.length) {
              callback();
            }
          };
          img.onerror = function() {
            // Use a placeholder if thumbnail fails to load
            video.thumbnailImg = null;
            loadedCount++;
            if (loadedCount === videos.length) {
              callback();
            }
          };
          img.src = video.thumbnailUrl;
        } else {
          loadedCount++;
          if (loadedCount === videos.length) {
            callback();
          }
        }
      });
      
      // If no thumbnails loaded after 5 seconds, proceed anyway
      setTimeout(() => {
        if (loadedCount < videos.length) {
          console.log("Timeout waiting for thumbnails, proceeding with what we have");
          callback();
        }
      }, 5000);
    }
    
    function initWheel(canvas, spinButton, videos) {
      const ctx = canvas.getContext('2d');
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = Math.min(centerX, centerY) - 30;
      
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
          const duration = 7000; // 7 seconds
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
              const segmentAngle = (Math.PI * 2) / videos.length;
              const normalizedRotation = (rotation % (Math.PI * 2));
              const selectedIndex = videos.length - 1 - Math.floor(normalizedRotation / segmentAngle);
              const adjustedIndex = selectedIndex % videos.length;
              
              // Show selected video and highlight it
              highlightSelectedSegment(adjustedIndex);
              
              // Navigate to the selected video after a short delay
              setTimeout(() => {
                window.location.href = videos[adjustedIndex].url;
              }, 1500);
            }
          }
          
          requestAnimationFrame(rotateWheel);
        }
      });
      
      function drawWheel() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw outer circle
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius + 5, 0, Math.PI * 2);
        ctx.fillStyle = '#000';
        ctx.fill();
        
        // Draw segments
        const segmentAngle = (Math.PI * 2) / videos.length;
        
        for (let i = 0; i < videos.length; i++) {
          const startAngle = i * segmentAngle + rotation;
          const endAngle = (i + 1) * segmentAngle + rotation;
          
          ctx.beginPath();
          ctx.moveTo(centerX, centerY);
          ctx.arc(centerX, centerY, radius, startAngle, endAngle);
          ctx.closePath();
          
          // Alternate background colors for segments
          ctx.fillStyle = i % 2 === 0 ? '#e62117' : '#cc181e';
          ctx.fill();
          
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 2;
          ctx.stroke();
          
          // Draw thumbnail in segment if available
          drawThumbnailInSegment(videos[i], startAngle, endAngle);
          
          // Draw title text in segment
          drawTitleInSegment(videos[i].title, startAngle, endAngle);
        }
        
        // Draw center circle
        ctx.beginPath();
        ctx.arc(centerX, centerY, 50, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 4;
        ctx.stroke();
        
        // Draw YouTube logo in center
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillStyle = 'red';
        ctx.fillText('YouTube', centerX, centerY - 5);
        ctx.fillStyle = '#333';
        ctx.font = '18px Arial';
        ctx.fillText('Wheel', centerX, centerY + 18);
        
        // Draw pointer
        ctx.beginPath();
        ctx.moveTo(centerX, centerY - radius - 15);
        ctx.lineTo(centerX - 10, centerY - radius + 5);
        ctx.lineTo(centerX + 10, centerY - radius + 5);
        ctx.closePath();
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      
      function drawThumbnailInSegment(video, startAngle, endAngle) {
        if (!video.thumbnailImg) return;
        
        const midAngle = (startAngle + endAngle) / 2;
        const thumbRadius = radius * 0.65; // Position thumbnails at 65% of radius
        
        // Calculate position for thumbnail
        const thumbX = centerX + Math.cos(midAngle) * thumbRadius;
        const thumbY = centerY + Math.sin(midAngle) * thumbRadius;
        
        // Size for thumbnails
        const thumbSize = radius * 0.25;
        
        // Save context and rotate
        ctx.save();
        ctx.translate(thumbX, thumbY);
        ctx.rotate(midAngle + Math.PI/2); // Rotate to face outward
        
        // Draw thumbnail
        try {
          ctx.drawImage(video.thumbnailImg, -thumbSize/2, -thumbSize/2, thumbSize, thumbSize * 0.6);
        } catch (e) {
          console.error("Error drawing thumbnail:", e);
        }
        
        ctx.restore();
      }
      
      function drawTitleInSegment(title, startAngle, endAngle) {
        const midAngle = (startAngle + endAngle) / 2;
        const textRadius = radius * 0.85; // Position text at 85% of radius
        
        const shortTitle = title.length > 15 ? title.substring(0, 15) + '...' : title;
        
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(midAngle);
        
        ctx.textAlign = 'right';
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px Arial';
        ctx.fillText(shortTitle, textRadius - 10, 5);
        
        ctx.restore();
      }
      
      function highlightSelectedSegment(index) {
        const segmentAngle = (Math.PI * 2) / videos.length;
        const startAngle = index * segmentAngle + rotation;
        const endAngle = (index + 1) * segmentAngle + rotation;
        
        // Draw highlighted segment
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.closePath();
        
        ctx.fillStyle = '#ffcc00';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Redraw the thumbnail and title
        drawThumbnailInSegment(videos[index], startAngle, endAngle);
        drawTitleInSegment(videos[index].title, startAngle, endAngle);
        
        // Show selection text
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#fff';
        ctx.fillText('Selected: ' + videos[index].title.substring(0, 20) + (videos[index].title.length > 20 ? '...' : ''), centerX, canvas.height - 20);
        
        // Re-enable spin button after highlighting
        spinButton.disabled = false;
        rotating = false;
      }
    }
  })();