/* jshint esversion: 6 */
/* global getConfig, StatusBar, WPAPI */

(function(){
  'use strict';
  
  $.widget("custom.kangastusDatabase", {
    
    options: {
    },
    
    _create : function() {
      this.items = {};
      $(document.body).trigger("databaseInitialized");
    },
    
    handleError: function(error) {
      console.error(error);
    },
    
    upsertKangastusItem: function(id, data) {
      this.items[id] = data;
      return;
    },
    
    listKangastusItemsByParent: function(parent) {
      return new Promise((resolve, reject) => {
        const kangastusIds = Object.keys(this.items);
        const data = [];
        for (let i = 0; i < kangastusIds.length; i++) {
          if (parent == this.items[kangastusIds[i]].parent) {
            data.push(this.items[kangastusIds[i]]);
          }
        }

        if (data.length > 0) {
          resolve(data.sort((a, b) => {
            if (a.order > b.order) {
              return 1;
            } else if(b.order > a.order) {
              return -1;
            }
            return 0;
          })); 
        }

        data.length > 0 ? resolve(data) : resolve(null);
      });
    }
  });

})();