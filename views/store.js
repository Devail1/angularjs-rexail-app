const store = angular.module("storeModule", []);

store.controller("storeController", function ($rootScope, $http, $filter, $anchorScroll, cartActionsService, IMG_BASE_URL,CURRENCY_SIGN) {
    const ctrl = this;
    ctrl.state = {
        cartActions: cartActionsService,
        selectedSortBy: null,
        searchQuery: $rootScope.state.searchQuery,
        currencySign: CURRENCY_SIGN,
        // Setting initial value for pagination limit (infinite scroll)
        paginationLimit: 12,
        paginationStep: 12
    }

    // http get pagination goes here
    ctrl.loadMore = function () {
        ctrl.state.paginationLimit = ctrl.state.paginationLimit + ctrl.state.paginationStep
    }

    ctrl.handleCategoryClick = function (category) {
        $rootScope.state.selectedCategory = category

        // scroll to top
        $anchorScroll();
    }

    // Products Sort by value
    ctrl.sortProductsBy = function (value) {
        ctrl.state.selectedSortBy = value
        if (value === 'שם מוצר') $rootScope.state.selectedCategory.children = $filter('orderBy')($rootScope.state.selectedCategory.children, '-name', true);
        if (value === 'מחיר מהנמוך לגבוה') $rootScope.state.selectedCategory.children = $filter('orderBy')($rootScope.state.selectedCategory.children, '-price', true);
        if (value === 'מחיר מהגבוהה לנמוך') $rootScope.state.selectedCategory.children = $filter('orderBy')($rootScope.state.selectedCategory.children, 'price', true);
        if (value === 'מוצרים במבצע') $rootScope.state.selectedCategory.children = $filter('orderBy')($rootScope.state.selectedCategory.children, 'promoted', true);
    }

});

