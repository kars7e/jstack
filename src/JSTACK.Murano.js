/*
The MIT License

Copyright (c) 2012 Universidad Politecnica de Madrid

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

// JStack Murano Module
// ------------------

JSTACK.Murano = (function (JS, undefined) {

    "use strict";
    var params, check, configure, guid, getBlueprintTemplateList, createBlueprintTemplate, 
        getBlueprintTemplate, deleteBlueprintTemplate, createBlueprintTemplateTier,
        updateBlueprintTemplateTier, deleteBlueprintTemplateTier, 
        getBlueprintInstanceList, getBlueprintInstance, launchBlueprintInstance, stopBlueprintInstance,
        getServiceCatalogue;
    // This modules stores the `url` to which it will send every
    // request.
    params = {
        url : undefined,
        state : undefined,
        endpointType : "publicURL"
    };

    // Private functions
    // -----------------

    // Function `check` internally confirms that Keystone module is
    // authenticated and it has the URL of the Volume service.
    check = function (region) {
        if (JS.Keystone !== undefined && JS.Keystone.params.currentstate === JS.Keystone.STATES.AUTHENTICATED) {
            var service = JS.Keystone.getservice("application_catalog");
            if (service) {
                params.url = JSTACK.Comm.getEndpoint(service, region, params.endpointType);
                return true;
            }
            return false;
        }
        return false;
    };
    // Public functions
    // ----------------
    //

    // This function sets the endpoint type for making requests to Glance.
    // It could take one of the following values:
    // * "adminURL"
    // * "internalURL"
    // * "publicURL"
    // You can use this function to change the default endpointURL, which is publicURL.
    configure = function (endpointType) {
        if (endpointType === "adminURL" || endpointType === "internalURL" || endpointType === "publicURL") {
            params.endpointType = endpointType;
        }
    };

    guid = function () {
      function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
          .toString(16)
          .substring(1);
      }
      return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
        s4() + '-' + s4() + s4() + s4();
    }


    //-----------------------------------------------
    // Blueprint Catalogue
    //-----------------------------------------------

    // var getBlueprintCatalogList = function (callback, callbackError) {

    //     check();

    //     sendRequest('GET', 'catalog/org/' + orgName + '/environment', undefined, function (resp) {
    //         var bpList = x2js.xml_str2json(resp);
    //         callback(bpList.environmentDtoes.environmentDto_asArray);
    //     }, callbackError);
    // };

    // var getBlueprintCatalog = function (bp_id, callback, callbackError) {

    //     check();
    //     sendRequest('GET', 'catalog/org/' + orgName + '/environment/' + bp_id, undefined, function (resp) {
    //         var bp = x2js.xml_str2json(resp);
    //         callback(bp.environmentDto);
    //     }, callbackError);
    // };

    //-----------------------------------------------
    // Blueprint Templates
    //-----------------------------------------------

    getBlueprintTemplateList = function(callback, error, region) {
        var url, onOK, onError;
        if (!check(region)) {
            return;
        }
        url = params.url + '/templates';

        onOK = function(result) {
            if (callback !== undefined) {
                callback(result.templates);
            }
        };
        onError = function(message) {
            if (error !== undefined) {
                error(message);
            }
        };

        JS.Comm.get(url, JS.Keystone.params.token, onOK, onError);
    };

    getBlueprintTemplate = function (id, callback, error, region) {

        var url, onOK, onError;
        if (!check(region)) {
            return;
        }
        url = params.url + '/templates/' + id;

        onOK = function(result) {
            if (callback !== undefined) {
                result.tierDtos_asArray = result.services;
                for (var s in result.services) {
                    result.services[s].keypair = result.services[s].instance.keypair;
                    result.services[s].flavour = result.services[s].instance.flavor;
                    result.services[s].image = result.services[s].instance.image;
                    
                    // TODO: Cuál es el id de un service????
                    result.services[s].id = result.services[s]['?'].id;
                }
                callback(result);
            }
        };
        onError = function(message) {
            if (error !== undefined) {
                error(message);
            }
        };

        JS.Comm.get(url, JS.Keystone.params.token, onOK, onError);
    };

    createBlueprintTemplate = function (bp, callback, error, region) {
        var url, onOk, onError, data;
        if (!check(region)) {
            return;
        }

        url = params.url + '/templates';

        data = {
            "name": bp.name
        };

        onOk = function (result) {
            if (callback !== undefined) {
                callback(result);
            }
        };
        onError = function (message) {
            if (error !== undefined) {
                error(message);
            }
        };

        JS.Comm.post(url, data, JS.Keystone.params.token, onOk, onError);

    };

    deleteBlueprintTemplate = function (id, callback, error, region) {
        var url, onOk, onError;
        if (!check(region)) {
            return;
        }
        url = params.url + '/templates/' + id;

        onOk = function (result) {
            if (callback !== undefined) {
                callback(result);
            }
        };
        onError = function (message) {
            if (error !== undefined) {
                error(message);
            }
        };

        JS.Comm.del(url, JS.Keystone.params.token, onOk, onError);
    };

    createBlueprintTemplateTier = function (id, tier, callback, error, region) {

        var url, onOk, onError, data;
        if (!check(region)) {
            return;
        }

        url = params.url + '/templates/' + id + '/services';

        console.log('tier', tier);

        data = {
            "instance": {
                "flavor": tier.flavour, 
                "keypair": tier.keypair, 
                "image": tier.image, 
                "?": {
                    "type": "io.murano.resources.ConfLangInstance",         
                    "id":  "5843836d2a4145f0895d7e66ee8ccf43"
                }, 
                "name": tier.name
            }, 
            "name": tier.name,
            "?": {  
                "_26411a1861294160833743e45d0eaad9": {
                    "name": "orion"
                },
                "type": "io.murano.conflang.test.PuppetExample",    
                "id": guid()
            }
        }

        if (tier.networkDto) {
            data.instance.networks = {
                "useFlatNetwork": false, 
                "primaryNetwork": null, 
                "useEnvironmentNetwork": false, 
                "customNetworks": []
            };

            for (var n in tier.networkDto) {
                if (tier.networkDto[n].networkId) {
                    // Network exists in Openstack
                    var net = {
                        "internalNetworkName": tier.networkDto[n].networkName, 
                        "?": {
                            "type": "io.murano.resources.ExistingNeutronNetwork", 
                            "id": tier.networkDto[n].networkId
                        }
                    };

                    data.instance.networks.customNetworks.push(net);

                } else {
                    // New network created using an alias
                    var net = {
                        "autoUplink": true, 
                        "name": tier.networkDto[n].networkName, 
                        "?": {
                            "type": "io.murano.resources.NeutronNetworkBase", 
                            "id": "84f648b755cd44ffad4bd641c7574241" // ??????????????????? que id va aqui?
                        }, 
                        "autogenerateSubnet": true
                    };

                    data.instance.networks.customNetworks.push(net);
                }
            }
        }

        onOk = function (result) {
            if (callback !== undefined) {
                callback(result);
            }
        };
        onError = function (message) {
            if (error !== undefined) {
                error(message);
            }
        };

       JS.Comm.post(url, data, JS.Keystone.params.token, onOk, onError);

    };

    // var updateBlueprintTemplateTier = function (bp_id, tier, callback, callbackError, region) {

    //     var url, onOk, onError, data;
    //     if (!check(region)) {
    //         return;
    //     }

    //     url = params.url + '/templates/' + id + '/services';

    //     console.log('tier', tier);

    //     data = {
    //         "instance": {
    //             "flavor": tier.flavour, 
    //             "keypair": tier.keypair, 
    //             "image": tier.image, 
    //             "?": {
    //                 "type": "io.murano.resources.ConfLangInstance",         
    //                 "id":  "5843836d2a4145f0895d7e66ee8ccf43"
    //             }, 
    //             "name": tier.name
    //         }, 
    //         "name": tier.name,
    //         "?": {  
    //             "_26411a1861294160833743e45d0eaad9": {
    //                 "name": "orion"
    //             },
    //             "type": "io.murano.conflang.test.PuppetExample",    
    //             "id": "190c8705-5784-4782-83d7-0ab55a1449aa"
    //         }
    //     }

    //     onOk = function (result) {
    //         if (callback !== undefined) {
    //             callback(result);
    //         }
    //     };
    //     onError = function (message) {
    //         if (error !== undefined) {
    //             error(message);
    //         }
    //     };

    //    JS.Comm.put(url, data, JS.Keystone.params.token, onOk, onError);
    // };

    var deleteBlueprintTemplateTier = function (bp_id, service_id, callback, error, region) {

        var url, onOk, onError;
        if (!check(region)) {
            return;
        }
        url = params.url + '/templates/' + bp_id + '/services/' + service_id;

        onOk = function (result) {
            if (callback !== undefined) {
                callback(result);
            }
        };
        onError = function (message) {
            if (error !== undefined) {
                error(message);
            }
        };

        JS.Comm.del(url, JS.Keystone.params.token, onOk, onError);
    };

    // var getBlueprintTemplateTierProductList = function (bp_id, tier_id, callback, callbackError) {

    //     check();

    //     sendRequest('GET', 'catalog/org/' + orgName + '/vdc/' + vdc_id + '/environment/' + bp_id + '/tier/' + tier_id + '/productRelease', undefined, function (resp) {
    //         var bpt = x2js.xml_str2json(resp);
    //         callback(bpt.tierDtos);
    //     }, callbackError);
    // };

    // var addBlueprintTemplateTierProduct = function (bp_id, tier_id, product, callback, callbackError) {

    //     check();

    //     var p = {productReleaseDtos: product};

    //     var xmlProd = xmlHead + x2js.json2xml_str(p);

    //     sendRequest('POST', 'catalog/org/' + orgName + '/vdc/' + vdc_id + '/environment/' + bp_id + '/tier/' + tier_id + '/productRelease', xmlProd, function (resp) {
    //         callback(resp);
    //     }, callbackError);
    // };


    //-----------------------------------------------
    // Blueprint Instances
    //-----------------------------------------------

    getBlueprintInstanceList = function (callback, error, region) {

        var url, onOK, onError;
        if (!check(region)) {
            return;
        }
        url = params.url + '/environments';

        onOK = function(result) {
            if (callback !== undefined) {
                for (var e in result.environments) {
                    result.environments[e].blueprintName = result.environments[e].name;
                }
                callback(result.environments);
            }
        };
        onError = function(message) {
            if (error !== undefined) {
                error(message);
            }
        };

        JS.Comm.get(url, JS.Keystone.params.token, onOK, onError);
    };

    getBlueprintInstance = function (id, callback, error, region) {

        var url, onOK, onError;
        if (!check(region)) {
            return;
        }
        url = params.url + '/environments/' + id;

        onOK = function(result) {
            if (callback !== undefined) {
                result.tierDto_asArray = result.services;
                for (var s in result.services) {
                    result.services[s].keypair = result.services[s].instance.keypair;
                    result.services[s].flavour = result.services[s].instance.flavor;
                    result.services[s].image = result.services[s].instance.image;
                    
                    // TODO: Cuál es el id de un service????
                    result.services[s].id = result.services[s]['?'].id;
                }
                callback(result);
            }
        };
        onError = function(message) {
            if (error !== undefined) {
                error(message);
            }
        };

        JS.Comm.get(url, JS.Keystone.params.token, onOK, onError);
    };

    launchBlueprintInstance = function (id, name, callback, error, region) {

        var url, onOk, onError, data;
        if (!check(region)) {
            return;
        }

        url = params.url + '/templates/' + id + '/create-environment';

        data = {
            "name": name
        };

        onOk = function (result) {
            if (callback !== undefined) {
                callback(result);
            }
        };
        onError = function (message) {
            if (error !== undefined) {
                error(message);
            }
        };

        JS.Comm.post(url, data, JS.Keystone.params.token, function (result) {
            var url2 = params.url + '/environments/' + result.environment_id + '/sessions/' + result.session_id + '/deploy';
            JS.Comm.post(url2, undefined, JS.Keystone.params.token, onOk, onError);
        }, onError);
    };

    stopBlueprintInstance = function (id, callback, error, region) {

        var url, onOk, onError;
        if (!check(region)) {
            return;
        }
        url = params.url + '/environments/' + id;

        onOk = function (result) {
            if (callback !== undefined) {
                callback(result);
            }
        };
        onError = function (message) {
            if (error !== undefined) {
                error(message);
            }
        };

        JS.Comm.del(url, JS.Keystone.params.token, onOk, onError);
    };

    // var addVMToTier = function (bp_id, tierDto, callback, callbackError) {

    //     check();

    //     var t = {tierDto: tierDto};

    //     var xmlTier = xmlHead + x2js.json2xml_str(t);

    //     sendRequest('POST', 'envInst/org/' + orgName + '/vdc/' + vdc_id + '/environmentInstance/' + bp_id + '/tierInstance', xmlTier, function (resp) {
    //         callback(resp);
    //     }, callbackError);
    // };

    // var removeVMFromTier = function (bp_id, inst_id, callback, callbackError) {

    //     check();

    //     sendRequest('DELETE', 'envInst/org/' + orgName + '/vdc/' + vdc_id + '/environmentInstance/' + bp_id + '/tierInstance/' + inst_id, undefined, function (resp) {
    //         callback(resp);
    //     }, callbackError);
    // };

    //Task Management

    // var getTask = function (task_id, callback, callbackError) {

    //     check();

    //     sendRequest('GET', 'vdc/' + vdc_id + '/task/' + task_id, undefined, function (resp) {
    //         var task = x2js.xml_str2json(resp);
    //         callback(task.task);
    //     }, callbackError);
    // };

    // var getTasks = function (callback, callbackError) {

    //     check();

    //     sendRequest('GET', 'vdc/' + vdc_id + '/task', undefined, function (resp) {
    //         var task = x2js.xml_str2json(resp);
    //         callback(task.tasks);
    //     }, callbackError);
    // };


    // SDC

    getServiceCatalogue = function(callback, error, region) {
        var url, onOK, onError;
        if (!check(region)) {
            return;
        }
        url = params.url + '/catalog/packages';

        onOK = function(result) {
            if (callback !== undefined) {
                console.log('result', result);
                callback(result.templates);
            }
        };
        onError = function(message) {
            if (error !== undefined) {
                error(message);
            }
        };

        JS.Comm.get(url, JS.Keystone.params.token, onOK, onError);
    };

    return {
        getBlueprintTemplateList: getBlueprintTemplateList,
        createBlueprintTemplate: createBlueprintTemplate,
        getBlueprintTemplate: getBlueprintTemplate,
        deleteBlueprintTemplate: deleteBlueprintTemplate,
        createBlueprintTemplateTier: createBlueprintTemplateTier,
        //updateBlueprintTemplateTier: updateBlueprintTemplateTier, 
        deleteBlueprintTemplateTier: deleteBlueprintTemplateTier,
        getBlueprintInstanceList: getBlueprintInstanceList,
        getBlueprintInstance: getBlueprintInstance,
        launchBlueprintInstance: launchBlueprintInstance,
        stopBlueprintInstance: stopBlueprintInstance,
        getServiceCatalogue: getServiceCatalogue
    };

    // return {
    //     getBlueprintCatalogList: getBlueprintCatalogList,
    //     getBlueprintCatalog: getBlueprintCatalog,
    //     // getBlueprintCatalogTierList: getBlueprintCatalogTierList,
    //     // getBlueprintCatalogTier: getBlueprintCatalogTier,
    //     getBlueprintTemplateList: getBlueprintTemplateList,
    //     getBlueprintTemplate: getBlueprintTemplate,
    //     getBlueprintTemplateTierList: getBlueprintTemplateTierList,
    //     getBlueprintTemplateTier: getBlueprintTemplateTier,
    //     deleteBlueprintTemplateTier: deleteBlueprintTemplateTier,
    //     createBlueprintTemplate: createBlueprintTemplate,
    //     deleteBlueprintTemplate: deleteBlueprintTemplate,


    //     createBlueprintTemplateTier: createBlueprintTemplateTier,
    //     updateBlueprintTemplateTier: updateBlueprintTemplateTier,



    //     getBlueprintInstanceList: getBlueprintInstanceList,
    //     getBlueprintInstance: getBlueprintInstance,
    //     launchBlueprintInstance: launchBlueprintInstance,
    //     stopBlueprintInstance: stopBlueprintInstance,
    //     addVMToTier: addVMToTier,
    //     removeVMFromTier: removeVMFromTier,

    //     getBlueprintTemplateTierProductList: getBlueprintTemplateTierProductList,
    //     addBlueprintTemplateTierProduct: addBlueprintTemplateTierProduct,





    //     getTask: getTask,
    //     getTasks: getTasks
    // };

}(JSTACK));