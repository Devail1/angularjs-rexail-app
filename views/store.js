const store = angular.module("storeModule", []);

store.controller("storeController", function ($rootScope, $filter, $anchorScroll, cartActionsService, CURRENCY_SIGN) {
    const ctrl = this;
    ctrl.state = {
        cartActions: cartActionsService,
        selectedSortBy: null,
        searchQuery: $rootScope.globalState.searchQuery,
        currencySign: CURRENCY_SIGN,
        // Setting initial value for pagination limit (infinite scroll)
        paginationLimit: 12,
        paginationStep: 12
    }

    // http get pagination goes here
    ctrl.onLoadMore = function () {
        ctrl.state.paginationLimit = ctrl.state.paginationLimit + ctrl.state.paginationStep
    }

    ctrl.onCategoryClick = function (category) {
        $rootScope.globalState.selectedCategory = category

        // scroll to top
        $anchorScroll();
    }

    // Products Sort by value
    ctrl.onProductsSortBy = function (value) {
        ctrl.state.selectedSortBy = value
        if (value === 'שם מוצר') $rootScope.globalState.selectedCategory.children = $filter('orderBy')($rootScope.globalState.selectedCategory.children, '-name', true);
        if (value === 'מחיר מהנמוך לגבוה') $rootScope.globalState.selectedCategory.children = $filter('orderBy')($rootScope.globalState.selectedCategory.children, '-price', true);
        if (value === 'מחיר מהגבוהה לנמוך') $rootScope.globalState.selectedCategory.children = $filter('orderBy')($rootScope.globalState.selectedCategory.children, 'price', true);
        if (value === 'מוצרים במבצע') $rootScope.globalState.selectedCategory.children = $filter('orderBy')($rootScope.globalState.selectedCategory.children, 'promoted', true);
    }
});

