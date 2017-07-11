/* jshint esversion: 6 */
/* global getConfig, StatusBar, WPAPI, AndroidFullScreen */

(function(){
  'use strict';
  
  $.widget("custom.kangastus", {
    
    options: {
    },
    
    _create : function() {
      $(document.body).on("databaseInitialized", $.proxy(this._onDatabaseInitialized, this));
      $(document.body).on("touchend", '.index .kangastus-item', $.proxy(this._onIndexKangastusItemTouchEnd, this));
      $(document.body).on("touchend", '.home-btn-container', $.proxy(this._onHomeBtnTouchEnd, this));
      $(document.body).on("touchstart", $.proxy(this._onUserInteraction, this));
      $(document.body).on("touchend",  '.swiper-button-next,.swiper-button-prev', function() { $(this).trigger('click'); });
      //$(document.body).on("touchstart", '.index .kangastus-item', $.proxy(this._onIndexKangastusItemTouchStart, this));
      
      $(document.body).kangastusWordpress();    
      $(document.body).kangastusDatabase();
      $(document.body).kangastusAnimation();

      this.maxRenderingTimer = null;
      this.prevRootIndex = null;
      this.targetPage = null;
      this.contentVisible = false;
      this.rendering = false;
      this.swiper = null;
      this.returnToHomeScreenTimer = null;
      this._resetSwiper((swiper) => {
        this._onIndexSlideVisible(swiper);
      });

    },

    _onIndexSlideVisible: function(swiper) {
      swiper.lockSwipes();
      $('.footer-container').show();
      $('.swiper-pagination').hide();
      $('.swiper-button-next').hide();
      $('.swiper-button-prev').hide();
      $('.header-container').hide();
      this.contentVisible = false;
      this._unsetReturnToHomeScreenTimer();
    },
    
    _onContentSlideVisible: function() {
      $('.footer-container').hide();
      $('.header-container').show();
      $('.swiper-pagination').show();
      $('.swiper-button-next').show();
      $('.swiper-button-prev').show();
      this.contentVisible = true;
      this._setReturnToHomeScreenTimer();
      this.rendering = false;
      this._clearMaxRenderingTimer();
      this.swiper.unlockSwipes();
    },

    _onUserInteraction: function() {
      if (this.contentVisible) {
        this._setReturnToHomeScreenTimer();
      }
    },

    _unsetReturnToHomeScreenTimer: function() {
      if (this.returnToHomeScreenTimer) {
        clearTimeout(this.returnToHomeScreenTimer);
        this.returnToHomeScreenTimer = null;
      }
    },

    _setReturnToHomeScreenTimer: function() {
      this._unsetReturnToHomeScreenTimer();
      this.returnToHomeScreenTimer = setTimeout(() => {
        this.swiper.slideTo(1, 400, true);
      }, 1000 * 60 * 5);
    },

    _resetSwiper: function(callback) {
      if (this.swiper) {
        this.swiper.destroy();
      }
      
      this.swiper = new Swiper('.swiper-container', {
        pagination: '.swiper-pagination',
        paginationType: 'custom',
        paginationClickable: false,
        longSwipesMs: 900,
        paginationCustomRender: function (swiper, current, total) {
          return `${current - 1} / ${total - 1}`;
        },
        nextButton: '.swiper-button-next',
        prevButton: '.swiper-button-prev',
        slidesPerView: 1,
        centeredSlides: true,
        spaceBetween: 30,
        onSlideChangeEnd: (swiper) => {
          const slideIndex = $('.swiper-slide-active').attr("data-swiper-slide-index");
          if (!slideIndex || slideIndex == 0) {
            this._onIndexSlideVisible(swiper);
          }
        },
        loop: true,
        loopedSlides: 0
      });
      this.swiper.lockSwipes();
      if (typeof callback === 'function') {
        callback(this.swiper);
      }
    },

    _onHomeBtnTouchEnd: function() {
      this.swiper.slideTo(1, 400, true);
    },
    
    _openSlidesByParent: function (parentId, parentBg, parentTitle) {
      if (this.rendering) {
        return;
      } 
      this.rendering = true;
      $('.header-container').attr('style', parentBg);
      $('.header-title').text(parentTitle);
      this._renderSlidesByParent(parentId);
    },

    _setMaxRenderingTimer: function() {
      if (this.maxRenderingTimer) {
        clearTimeout(this.maxRenderingTimer);
      }
      
      this.maxRenderingTimer = setTimeout(() => {
        this.rendering = false;
      }, 5000);
    },
    
    _clearMaxRenderingTimer: function() {
      if (this.maxRenderingTimer) {
        clearTimeout(this.maxRenderingTimer);
        this.maxRenderingTimer = null;
      }
    },

    _renderSlidesByParent: function(parent) {
      this._setMaxRenderingTimer();
      $(document.body).kangastusDatabase('listKangastusItemsByParent', parseInt(parent))
        .then((items) => {
          const slides = [];
          items.forEach((item) => {
            slides.push(pugKangastusPage({
              item: item
            }));
          });

          const slideCount = this.swiper.slides.length;
          if (slideCount > 1) {
            const slidesToRemove = [];
            for(let i = 1; i < slideCount; i++) {
              slidesToRemove.push(i);
            }
            this.swiper.removeSlide(slidesToRemove);
          }

          this.swiper.appendSlide(slides);
          this._resetSwiper(() => {
            this.swiper.unlockSwipes();
            this.swiper.slideNext();
            this._onContentSlideVisible();
          });

        })
        .catch((err) => {
          console.log('ERROR:' + err);
        });
    },
    
    _renderIndex: function () {
      $(document.body).kangastusDatabase('listKangastusItemsByParent', 0)
        .then((items) => {
          const indexHtml = pugKangastusIndex({
            items: items
          });

          if ($('.index').length > 0) {
            $('.index').replaceWith($(indexHtml));
          } else {
            $('.content-container').append($(indexHtml));
          }
          
          this.swiper.update();
        })
        .catch((err) => {
          console.log(err);
        });
    },
    
    _update: function () {
      $(document.body).kangastusWordpress('update')
        .then((items) => {
          items.forEach((item) => {
            if (item) {
              let background = '';
              item.background = null;

              if (item.colorMask) {
                background += `linear-gradient(${item.colorMask}, ${item.colorMask})`
              }

              if (item.localImageUrl) {
                if (item.colorMask) {
                  background += ',';
                }

                background += `url(${item.localImageUrl})`;
              }

              if (background && background.length > 0) {
                item.background = `background-image: ${background};`;  
              }

              item.order = item['menu_order'];
              $(document.body).kangastusDatabase("upsertKangastusItem", item.id, item);
            }
          });  
        })
        .catch((updateErr) => { console.log(JSON.stringify(updateErr)); })
        .then(() => { setTimeout(() => { this._update() }, 30000 ); });
    },
    
    _createColormakedBackground(localImageUrl, colorMask) {
      let background = '';
      
      if (colorMask) {
        background += `linear-gradient(${colorMask}, ${colorMask})`
      }

      if (localImageUrl) {
        if (colorMask) {
          background += ',';
        }
              
        background += `url(${localImageUrl})`;
      }
      
      return background;
    },

    _onIndexKangastusItemTouchStart: function (e) {
      $(document.body).kangastusAnimation('animate', e.target, 'pulse');
    },
    
    _onIndexKangastusItemTouchEnd: function (e) {
      if (this.contentVisible) {
        return false;
      }
      const parent = $(e.target).closest('.kangastus-item');
      const parentId = $(parent).attr('data-id');
      const parentTitle = $(parent).find('.index-title').text();
      const parentBg = $(parent).attr('style');
      
      this._openSlidesByParent(parentId, parentBg, parentTitle);
    },

    _onDatabaseInitialized: function () {
      this._update();
      setInterval($.proxy(this._renderIndex, this), 5000);
    }
  });
  
  $(document).on("deviceready", () => {
    $(document.body).kangastus();      
  });

})();
