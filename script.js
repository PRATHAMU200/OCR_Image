document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('fileInput');
    const uploadButton = document.getElementById('uploadButton');
    const captureButton = document.getElementById('captureButton');
    const clearButton = document.getElementById('clearButton');
    const clear = document.getElementById('clear');
    const imagePreview = document.getElementById('imagePreview');
    const textResult = document.getElementById('textResult');
    const copyButton = document.getElementById('copyButton');

    let selectedImage = null;
    let stream = null; // Variable to hold the camera stream

    // Upload image button click handler
    uploadButton.addEventListener('click', function() {
        fileInput.click();
    });

    // File input change handler
    fileInput.addEventListener('change', function() {
        const file = fileInput.files[0];
        if (file) {
            selectedImage = file;
            showImagePreview(selectedImage);
            performOCR(selectedImage);
        }
    });

    // Capture live image button click handler
    captureButton.addEventListener('click', function() {
        if (stream) {
            // Stop any existing stream
            stream.getTracks().forEach(track => track.stop());
        }

        navigator.mediaDevices.getUserMedia({ video: true })
            .then(function(mediaStream) {
                stream = mediaStream;
                const video = document.createElement('video');
                video.srcObject = mediaStream;
                video.setAttribute('autoplay', '');
                video.setAttribute('playsinline', ''); // For Safari

                // Append the video element to the preview div
                imagePreview.innerHTML = '';
                imagePreview.appendChild(video);

                // Wait for video to be loaded and ready to play
                video.onloadedmetadata = function(e) {
                    video.play();
                };

                // Event listener for capturing the image
                video.addEventListener('click', function() {
                    const canvas = document.createElement('canvas');
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);

                    // Convert canvas to blob and display in preview
                    canvas.toBlob(function(blob) {
                        const filename = 'capture.jpg';
                        const imageFile = new File([blob], filename, { type: 'image/jpeg' });
                        showImagePreview(imageFile);
                        performOCR(imageFile);

                        // Stop the camera stream
                        stream.getTracks().forEach(track => track.stop());
                    },'image/jpeg');
                });
            })
            .catch(function(err) {
                console.error('Error accessing camera:', err);
            });
    });

    // Clear image button click handler
    clearButton.addEventListener('click', function() {
        selectedImage = null;
        imagePreview.innerHTML = '';
        textResult.innerText = '';
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
    });

    // Copy text button click handler
    copyButton.addEventListener('click', function() {
        const textToCopy = textResult.innerText.trim();
        if (textToCopy) {
            navigator.clipboard.writeText(textToCopy)
                .then(() => {
                    alert('Text copied to clipboard!');
                })
                .catch(err => {
                    console.error('Failed to copy text: ', err);
                });
        }
    });

    // Function to display the selected image preview
    function showImagePreview(imageFile) {
        if (imageFile instanceof Blob) {
            const reader = new FileReader();
            reader.onload = function(event) {
                const imgElement = document.createElement('img');
                imgElement.src = event.target.result;
                imgElement.style.maxWidth = '100%';
                imagePreview.innerHTML = '';
                imagePreview.appendChild(imgElement);
            };
            reader.readAsDataURL(imageFile);
        } else if (imageFile instanceof File) {
            const imgElement = document.createElement('img');
            imgElement.src = URL.createObjectURL(imageFile);
            imgElement.style.maxWidth = '100%';
            imagePreview.innerHTML = '';
            imagePreview.appendChild(imgElement);
        }
    }

    // Function to perform OCR using an external API (example here using OCR.space API)
    async function performOCR(imageFile) {
        const apiKey = 'K85371244788957'; // Replace with your OCR API key
        const formData = new FormData();
        formData.append('file', imageFile);
        formData.append('language', 'eng');
        formData.append('apikey', apiKey);

        try {
            const response = await fetch('https://api.ocr.space/parse/image', {
                method: 'POST',
                body: formData
            });
            const data = await response.json();
            if (data && data.ParsedResults && data.ParsedResults.length > 0) {
                const extractedText = data.ParsedResults[0].ParsedText;
                displayExtractedText(extractedText);
            } else {
                displayExtractedText('Failed to extract text.');
            }
        } catch (error) {
            console.error('Error performing OCR:', error);
            displayExtractedText('Error performing OCR.');
        }
    }
    clear.addEventListener('click', function() {
        selectedImage = null;
        imagePreview.innerHTML = '';
        textResult.innerText = '';
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
    });
    // Function to display extracted text
    function displayExtractedText(text) {
        textResult.innerText = text;
    }
});
