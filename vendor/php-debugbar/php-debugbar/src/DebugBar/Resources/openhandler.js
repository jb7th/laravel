if (typeof(PhpDebugBar) == 'undefined') {
    // namespace
    var PhpDebugBar = {};
    PhpDebugBar.$ = jQuery;
}

(function($) {

    var csscls = function(cls) {
        return PhpDebugBar.utils.csscls(cls, 'phpdebugbar-openhandler-');
    };

    PhpDebugBar.OpenHandler = PhpDebugBar.Widget.extend({

        className: 'phpdebugbar-openhandler',

        defaults: {
            items_per_page: 20
        },

        render: function() {
            var self = this;

            this.$el.appendTo('body').hide();
            this.$closebtn = $('<a><i class="phpdebugbar-fa phpdebugbar-fa-times"></i></a>');
            this.$table = $('<tbody />');
            $('<div>PHP DebugBar | Open</div>').addClass(csscls('header')).append(this.$closebtn).appendTo(this.$el);
            $('<table><thead><tr><th width="155">Date</th><th width="75">Method</th><th>URL</th><th width="125">IP</th><th width="100">Filter data</th></tr></thead></table>').append(this.$table).appendTo(this.$el);
            this.$actions = $('<div />').addClass(csscls('actions')).appendTo(this.$el);

            this.$closebtn.on('click', function() {
                self.hide();
            });

            this.$loadmorebtn = $('<a>Load more</a>')
                .appendTo(this.$actions)
                .on('click', function() {
                    self.find(self.last_find_request, self.last_find_request.offset + self.get('items_per_page'), self.handleFind.bind(self));
                });

            this.$showonlycurrentbtn = $('<a>Show only current URL</a>')
                .appendTo(this.$actions)
                .on('click', function() {
                    self.$table.empty();
                    self.find({uri: window.location.pathname}, 0, self.handleFind.bind(self));
                });

            this.$showallbtn = $('<a>Show all</a>')
                .appendTo(this.$actions)
                .on('click', function() {
                    self.refresh();
                });

            this.$clearbtn = $('<a>Delete all</a>')
                .appendTo(this.$actions)
                .on('click', function() {
                    self.clear(function() {
                        self.hide();
                    });
                });

            this.addSearch();

            this.$overlay = $('<div />').addClass(csscls('overlay')).hide().appendTo('body');
            this.$overlay.on('click', function() {
                self.hide();
            });
        },

        refresh: function() {
            this.$table.empty();
            this.$loadmorebtn.show();
            this.find({}, 0, this.handleFind.bind(this));
        },

        addSearch: function(){
            var self = this;
            var searchBtn = $('<button />')
                .text('Search')
                .attr('type', 'submit')
                .on('click', function(e) {
                    self.$table.empty();
                    var search = {};
                    var a = $(this).parent().serializeArray();
                    $.each(a, function() {
                        if(this.value){
                            search[this.name] = this.value;
                        }
                    });

                    self.find(search, 0, self.handleFind.bind(self));
                    e.preventDefault();
                });

            $('<form />')
                .append('<br/><b>Filter results</b><br/>')
                .append('<select name="method"><option selected>(Method)</option><option>GET</option><option>POST</option><option>PUT</option><option>DELETE</option></select>')
                .append('<input type="text" name="uri" placeholder="URI">')
                .append('<input type="text" name="ip" placeholder="IP">')
                .append(searchBtn)
                .appendTo(this.$actions);
        },

        handleFind: function(data) {
            var self = this;
            $.each(data, function(i, meta) {
               var a = $('<a />')
                    .text('Load dataset')
                    .on('click', function(e) {
                       self.hide();
                       self.load(meta['id'], function(data) {
                           self.callback(meta['id'], data);
                       });
                       e.preventDefault();
                    });

                var method = $('<a />')
                    .text(meta['method'])
                    .on('click', function(e) {
                        self.$table.empty();
                        self.find({method: meta['method']}, 0, self.handleFind.bind(self));
                        e.preventDefault();
                    });

                var uri = $('<a />')
                    .text(meta['uri'])
                    .on('click', function(e) {
                        self.hide();
                        self.load(meta['id'], function(data) {
                            self.callback(meta['id'], data);
                        });
                        e.preventDefault();
                    });

                var ip = $('<a />')
                    .text(meta['ip'])
                    .on('click', function(e) {
                        self.$table.empty();
                        self.find({ip: meta['ip']}, 0, self.handleFind.bind(self));
                        e.preventDefault();
                    });

                var search = $('<a />')
                    .text('Show URL')
                    .on('click', function(e) {
                        self.$table.empty();
                        self.find({uri: meta['uri']}, 0, self.handleFind.bind(self));
                        e.preventDefault();
                    });

                $('<tr />')
                    .append('<td>' + meta['datetime'] + '</td>')
                    .append('<td>' + meta['method'] + '</td>')
                    .append($('<td />').append(uri))
                    .append($('<td />').append(ip))
                    .append($('<td />').append(search))
                    .appendTo(self.$table);
            });
            if (data.length < this.get('items_per_page')) {
                this.$loadmorebtn.hide();
            }
        },

        show: function(callback) {
            this.callback = callback;
            this.$el.show();
            this.$overlay.show();
            this.refresh();
        },

        hide: function() {
            this.$el.hide();
            this.$overlay.hide();
        },

        find: function(filters, offset, callback) {
            var data = $.extend({}, filters, {max: this.get('items_per_page'), offset: offset || 0});
            this.last_find_request = data;
            this.ajax(data, callback);
        },

        load: function(id, callback) {
            this.ajax({op: "get", id: id}, callback);
        },

        clear: function(callback) {
            this.ajax({op: "clear"}, callback);
        },

        ajax: function(data, callback) {
            var url = this.get('url');
            if (data) {
                url = url + ( url.includes('?') ? '&' : '?' ) + new URLSearchParams(data);
            }

            fetch(url, {
                method: "GET",
                headers: {
                    "Accept": "application/json",
                },
            })
                .then((data) => data.json())
                .then(callback);
        }

    });

})(PhpDebugBar.$);
