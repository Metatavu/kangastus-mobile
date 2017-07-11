/* jshint esversion: 6 */
/* global getConfig, StatusBar, WPAPI, Promise */

(function(){
  'use strict';
  
  $.widget("custom.kangastusWordpress", {
    
    options: {
    },
    
    _create : function() {
    },
    
    update() {
      return new Promise((resolve, reject) => {
        $.ajax({
          url: 'https://hallinta-mikkeli.kunta-api.fi/wp-json/wp/v2/kangastus/?per_page=100',
          success: (data) => {
            for (let i = 0; i < data.length; i++) {
              if (data[i]['better_featured_image'] && data[i]['better_featured_image']['source_url']) {
                let url = data[i]['better_featured_image']['source_url'];
                data[i].localImageUrl = url;
              }
            }
            resolve(data);
          },
          error: function (jqXHR, text, err) {
            reject(err);
          }
        });
      }); 
    }
    
    
  });

})();