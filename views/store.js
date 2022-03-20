const store = angular.module("storeModule", []);

store.controller("storeController", function ($rootScope, $http, $filter, $anchorScroll, cartActionsService, IMG_BASE_URL,CURRENCY_SIGN) {
    const ctrl = this;
    ctrl.state = {
        cartActions: cartActionsService,
        // Setting initial category
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

        console.log($rootScope.state)

        // scroll to top
        $anchorScroll();
    }

    // Products Sort by value
    ctrl.sortProductsBy = function (value) {
        ctrl.selectedSortBy = value
        if (value === 'שם מוצר') ctrl.state.selectedCategory.children = $filter('orderBy')(ctrl.state.selectedCategory.children, '-name', true);
        if (value === 'מחיר מהנמוך לגבוה') ctrl.state.selectedCategory.children = $filter('orderBy')(ctrl.state.selectedCategory.children, '-price', true);
        if (value === 'מחיר מהגבוהה לנמוך') ctrl.state.selectedCategory.children = $filter('orderBy')(ctrl.state.selectedCategory.children, 'price', true);
        if (value === 'מוצרים במבצע') ctrl.state.selectedCategory.children = $filter('orderBy')(ctrl.state.selectedCategory.children, 'promoted', true);
    }

    // const fetchProducts = function () {
    //     console.log('fetching products...')
    //     $http.get('https://test.rexail.co.il/client/public/store/website?domain=testeitan.rexail.co.il')
    //         .then(function (response) {
    //             ctrl.state.storeData = response.data.data;
    //             // Load store info to root scope
    //             $rootScope.state.storeInfo = ctrl.state.storeData.store
    //             $http.get(`https://test.rexail.co.il/client/public/store/catalog?s_jwe=${ctrl.state.storeData.jsonWebEncryption}`)
    //                 .then(function (response) {
    //                     // Formatting data products by categories
    //                     ctrl.state.categoriesData = ctrl.formatData(response.data.data);
    //                     // Setting initial category
    //                     ctrl.state.selectedCategory = ctrl.state.categoriesData[0]
    //                 });
    //         });
    // }
    //
    // fetchProducts();

    // ctrl.formatData = function (array) {
    //     return Object.values(array.reduce((obj, current) => {
    //         if (!obj[current.productCategory.id]) {
    //             obj[current.productCategory.id] = {
    //                 id: current.productCategory.id,
    //                 name: current.productCategory.name,
    //                 children: []
    //             }
    //         }
    //
    //         // If there is no primary quantity unit than use the first product selling unit.
    //         let primaryQuantityUnit = !current.product.primaryQuantityUnit && current.productSellingUnits[0]
    //
    //         let productModel = {
    //             id: current.id,
    //             name: current.product.name,
    //             fullName: current.fullName,
    //             imageUrl: IMG_BASE_URL.concat(current.imageUrl),
    //             price: current.price,
    //             promoted: current.promoted,
    //             originalPrice: current.originalPrice,
    //             productQuality: current.productQuality,
    //             currentRelevancy: current.currentRelevancy,
    //             primaryQuantityUnit: current.primaryQuantityUnit ? current.primaryQuantityUnit : current.productSellingUnits[0],
    //             productSellingUnits: current.productSellingUnits,
    //             commentType: current.commentType
    //         }
    //
    //         // Push to all products category
    //         if (current.product.id) obj['0'].children.push(productModel)
    //         // Push to promoted products category
    //         if (current.promoted) obj['1'].children.push(productModel)
    //
    //         // Continue reformatting
    //         obj[current.productCategory.id].children.push(productModel)
    //
    //         return obj
    //     }, {
    //         // Initial state manually with default categories
    //         0: {id: 0, name: 'כל המוצרים', children: []}, 1: {id: 1, name: 'מבצעים', children: []}
    //     }));
    // }

});

