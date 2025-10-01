window.HELP_IMPROVE_VIDEOJS = false;

// Removed interpolation code - not needed

// Video overlay functionality
document.addEventListener('DOMContentLoaded', function() {
    const videoContainers = document.querySelectorAll('.video-container');
    
    videoContainers.forEach((container) => {
        const overlay = container.querySelector('.video-overlay');
        if (!overlay) return;
        
        const overlayTitle = overlay.querySelector('.overlay-title');
        const overlayComparison = overlay.querySelector('.overlay-comparison');
        const overlayAnalysis = overlay.querySelector('.overlay-analysis');
        
        // Populate overlay content from data attributes
        if (overlayTitle && container.dataset.method) {
            overlayTitle.textContent = container.dataset.method;
        }
        
        if (overlayComparison && container.dataset.comparison) {
            overlayComparison.textContent = container.dataset.comparison;
        }
        
        if (overlayAnalysis && container.dataset.analysis) {
            overlayAnalysis.textContent = container.dataset.analysis;
        }
        
        // Pause/play video on hover
        container.addEventListener('mouseenter', function() {
            const video = container.querySelector('video');
            if (video) video.pause();
        });
        
        container.addEventListener('mouseleave', function() {
            const video = container.querySelector('video');
            if (video) video.play();
        });
    });
});

$(document).ready(function() {
    console.log('jQuery document ready fired!');
    // Check for click events on the navbar burger icon
    $(".navbar-burger").click(function() {
      // Toggle the "is-active" class on both the "navbar-burger" and the "navbar-menu"
      $(".navbar-burger").toggleClass("is-active");
      $(".navbar-menu").toggleClass("is-active");
    });

    var options = {
            slidesToScroll: 1,
            slidesToShow: 3,
            loop: true,
            infinite: true,
            autoplay: false,
            autoplaySpeed: 3000,
    }

        // Initialize all div with carousel class
    var carousels = bulmaCarousel.attach('.carousel', options);

    // Loop on each carousel initialized
    for(var i = 0; i < carousels.length; i++) {
        // Add listener to  event
        carousels[i].on('before:show', state => {
            console.log(state);
        });
    }

    // Access to bulmaCarousel instance of an element
    var element = document.querySelector('#my-element');
    if (element && element.bulmaCarousel) {
        // bulmaCarousel instance is available as element.bulmaCarousel
        element.bulmaCarousel.on('before-show', function(state) {
            console.log(state);
        });
    }

    // Removed interpolation slider code - not needed

    bulmaSlider.attach();
});