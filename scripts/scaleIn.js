//masterNodeId, nodeGroup
var ARBITER_GROUP = "arb",
    sTargetAppid = getParam("TARGET_APPID"),
    aNodes = jelastic.env.control.GetEnvInfo(sTargetAppid, session).nodes,
    aNoSQLAddresses = [],
    aReplicaNodes = [],
    sArbiterIp = "";

for (var i = 0, n = aNodes.length; i < n; i += 1) {
    if (aNodes[i].nodeGroup == nodeGroup) {
        aNoSQLAddresses.push(String(aNodes[i].address));
    }
    
    if (!sArbiterIp && aNodes[i].nodeGroup == ARBITER_GROUP) {
        sArbiterIp = aNodes[i].address;
    }
}

aReplicaNodes = getReplicaAddresses();

for (var i = 0, n = aReplicaNodes.length; i < n; i += 1) {

    if (aReplicaNodes[i] == sArbiterIp) {
        delete aReplicaNodes[i];
    }

    if (aNoSQLAddresses.indexOf(aReplicaNodes[i]) != -1) {
        delete aReplicaNodes[i];
    }
}
aReplicaNodes = aReplicaNodes.filter(function(n){ 
    return n != undefined 
}); 

jelastic.marketplace.console.WriteLog("aReplicaNodes filtered ->" + aReplicaNodes);

for (var i = 0, n = aReplicaNodes.length; i < n; i += 1) {
    var oResp;
    
    jelastic.marketplace.console.WriteLog("removeSlave - masterNodeId ->" + masterNodeId);
    jelastic.marketplace.console.WriteLog("removeSlave - aReplicaNodes[i] ->" + aReplicaNodes[i]);
	
    oResp = removeSlave(masterNodeId, aReplicaNodes[i]);
    jelastic.marketplace.console.WriteLog("removeSlave - oResp ->" + oResp);
    if (!oResp || oResp.result != 0){
        return oResp;
    }
}

function removeSlave(masterId, ip) {
    var cmd = [
            "curl -fsSL \"${baseUrl}scripts/replicaSet.sh\" -o /tmp/replicaSet.sh",
            "/bin/bash /tmp/replicaSet.sh --exec=removeSlave --remove=" + ip + ":27017"
        ];

    jelastic.marketplace.console.WriteLog("removeSlave - isPrimary(masterId) ->" + isPrimary(masterId));
    
    if (!isPrimary(masterId)) {
        oResp = reconfigureRespSet();
    }
    
    return exec(masterId, cmd);
}

function reconfigureRespSet() {
    var oConfig = getRsConfig(),
        aAvailableMembers = [],
        oConfigMembers,
        sMemberHost,
	oResp,
        i,
        n;
    
    oConfigMembers = oConfig.members;
    jelastic.marketplace.console.WriteLog("reconfigureRespSet - oConfig ->" + oConfig);
    jelastic.marketplace.console.WriteLog("reconfigureRespSet - oConfigMembers ->" + oConfigMembers);
    for (i = 0, n = oConfig.members.length; i < n; i += 1) {
        sMemberHost = oConfig.members[i].host;
        jelastic.marketplace.console.WriteLog("reconfigureRespSet - sMemberHost ->" + sMemberHost);
        sMemberHost = sMemberHost.replace(':27017', '');
        if (aReplicaNodes.indexof(sMemberHost) == -1) {
            aAvailableMembers.push(oConfig.members[i]);
        }
        
        jelastic.marketplace.console.WriteLog("reconfigureRespSet - aAvailableMembers ->" + aAvailableMembers);
    }
	
    if (aAvailableMembers.length > 0) {
	    oConfig.members = aAvailableMembers;
        oResp = setNewConfig(oConfig);
        jelastic.marketplace.console.WriteLog("reconfigureRespSet - oResp ->" + oResp);
        return oResp;
    }
	
    return false;
}

function setNewConfig(oConfig) {
    var cmd = [
        "curl -fsSL \"${baseUrl}scripts/replicaSet.sh\" -o /tmp/replicaSet.sh",
        "/bin/bash /tmp/replicaSet.sh --exec=setConfig --config=" + oConfig
    ];
    
    return toJSON(masterNodeId, cmd))
}

function getRsConfig() {
    var cmd = [
        "curl -fsSL \"${baseUrl}scripts/replicaSet.sh\" -o /tmp/replicaSet.sh",
        "/bin/bash /tmp/replicaSet.sh --exec=getConfig"
    ];
    
    return toJSON(masterNodeId, cmd))
}

function isPrimary(nodeId) {
    var cmd,
	aCmdResp;
  
    cmd = [
        "curl -fsSL \"${baseUrl}scripts/replicaSet.sh\" -o /tmp/replicaSet.sh", 
        "/bin/bash /tmp/replicaSet.sh --exec=isMaster | grep ismaster | cut -c 15- | rev | cut -c 2- | rev && /bin/bash /tmp/replicaSet.sh --exec=isMaster | grep secondary | cut -c 16- | rev | cut -c 2- | rev"
    ];

    oResp = exec(nodeId, cmd);

	jelastic.marketplace.console.WriteLog("checkPrimaryNode - isPrimary - nodeId ->" + nodeId);
	jelastic.marketplace.console.WriteLog("checkPrimaryNode - isPrimary - cmd ->" + cmd);
	jelastic.marketplace.console.WriteLog("checkPrimaryNode - isPrimary - oResp ->" + oResp);
	jelastic.marketplace.console.WriteLog("checkPrimaryNode - isPrimary - exec(nodeId, cmd) ->" + exec(nodeId, cmd));
	jelastic.marketplace.console.WriteLog("checkPrimaryNode - isPrimary - exec(nodeId, cmd) ->" + exec(nodeId, cmd));
	jelastic.marketplace.console.WriteLog("checkPrimaryNode - isPrimary - exec(nodeId, cmd) ->" + exec(nodeId, cmd));
    if (!oResp || oResp.result != 0){
        return oResp;
    }
	jelastic.marketplace.console.WriteLog("isPrimary - nodeId->" + nodeId);
  	jelastic.marketplace.console.WriteLog("isPrimary - oResp->" + oResp);
    if (oResp.responses) {
        oResp = oResp.responses[0];
	    
	if (oResp.out) {
	    aCmdResp = oResp.out.replace(/\n/, ",").split(",");
	}
    }
	jelastic.marketplace.console.WriteLog("isPrimary - aCmdResp->" + aCmdResp);
    if (aCmdResp[0] == "true" && aCmdResp[1] == "false") {
        return true;
    }
    
    return false;
}

function old-isPrimary(nodeId) {
    var cmd;
  
    cmd = [
        "curl -fsSL \"${baseUrl}scripts/replicaSet.sh\" -o /tmp/replicaSet.sh", 
        "/bin/bash /tmp/replicaSet.sh --exec=isMaster | grep ismaster | cut -c 15- | rev | cut -c 2- | rev"
    ];

    oResp = exec(nodeId, cmd);
    jelastic.marketplace.console.WriteLog("isPrimary oResp ->" + oResp);
    if (!oResp || oResp.result != 0) {
        return oResp;
    }
  
    if (oResp.responses) {
        oResp = oResp.responses[0];
    }
    
    return oResp.out;
}

function getReplicaAddresses() {
    var cmd,
        oResp,
        aIps = [];
    
    cmd = [
        "curl -fsSL \"${baseUrl}scripts/replicaSet.sh\" -o /tmp/replicaSet.sh",
        "/bin/bash -x /tmp/replicaSet.sh --exec=getStatus | grep name"
    ];

    oResp = exec(${nodes.nosqldb[0].id}, cmd);
    if (!oResp || oResp.result != 0) {
        return oResp;
    }
    
    aIps = oResp.responses[0].out.replace(/.*\"name\" : \"/g, "");
    aIps = aIps.replace(/:27017/g, "");
    aIps = aIps.replace(/\n/g, "").slice(0, -2);
    
    return aIps.split("\",");
}

function exec(nodeid, cmd) {
    return jelastic.env.control.ExecCmdById(sTargetAppid, session, nodeid, toJSON([{
      "command": cmd.join("\n")
    }]));
}

return {
    result: 0
};
