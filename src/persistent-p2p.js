/* Based on: https://github.com/networked-aframe/networked-aframe/blob/master/examples/js/persistent-p2p.component.js

MIT License

Copyright (c) 2017 Hayden Lee

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

*/

/* global AFRAME, NAF */
AFRAME.registerComponent('persistent-p2p', {

  init: function() {
    this.onConnected = this.onConnected.bind(this);
    this.sendPersistentEntityCreated = this.sendPersistentEntityCreated.bind(this);

    if (NAF.clientId) {
      this.onConnected();
    } else {
      document.body.addEventListener('connected', this.onConnected, false);
    }
  },

  onConnected: function() {
    const receiveData = (_senderId, _dataType, data) => {
      if (data.eventType === 'persistentEntityCreated') {
        const el = document.createElement('a-entity');
        this.el.sceneEl.appendChild(el);
        el.setAttribute('networked', {
            networkId: data.networkId,
            template: data.template,
            persistent: true,
            owner: 'scene'
        });
        // If we receive a {persistent: true, isFirstSync: true} NAF `u` message before the
        // persistentEntityCreated message, the NAF message is stored in
        // NAF.entities._persistentFirstSyncs waiting the entity to be created.
        // After creating the entity like we just did above, we need to call
        // applyPersistentFirstSync to consume the received data to really
        // initialize the networked component, otherwise it won't show.
        NAF.utils.getNetworkedEntity(el).then((networkedEl) => {
          networkedEl.components.networked.applyPersistentFirstSync();
        });
      }
    }

    NAF.connection.subscribeToDataChannel('events', receiveData);

    // The persistentEntityCreated event is emitted by the spawner-persistent component.
    // Broadcast a persistentEntityCreated message to everyone in the room.
    document.body.addEventListener('persistentEntityCreated', this.sendPersistentEntityCreated, false);

    // Note that when a participant leave the room, the other participants take ownership of the persistent entities of the left participant,
    // see the code in the NetworkEntities.removeEntitiesOfClient function for details.

    // When a new participant enter the room, send the persistentEntityCreated
    // message for each persistent entity I own.
    // Sending the networked data are done by NAF already with the same logic.
    document.body.addEventListener('clientConnected', (evt) => {
      const targetClientId = evt.detail.clientId;
      for (const id in NAF.entities.entities) {
        if (NAF.entities.entities[id]) {
          const networkedComponent = NAF.entities.entities[id].components.networked;
          const networkedData = networkedComponent.data;
          if (networkedData.persistent && networkedData.owner && networkedComponent.isMine()) {
            const data = {
              eventType: 'persistentEntityCreated',
              networkId: networkedData.networkId,
              template: networkedData.template
            };
            NAF.connection.sendDataGuaranteed(targetClientId, 'events', data);
          }

          /* Sometimes replication of snowballs get stuck when a new player enters a room
            This extra call seems to unstick things. 
            Not really sure why it's necessary.
            Possible race condition where applyPersistentFirstSync() doesn't get called on
            remote clients due to a race between `hasLoaded` and the `initialized` event, 
            but I'm not completely sure if that's related.
            For now, this is the workaround that works best... */
          networkedComponent.syncAll(null, false)
          
        }
      }
    });

    document.body.removeEventListener('connected', this.onConnected, false);
  },

  sendPersistentEntityCreated: function(evt) {
    const el = evt.detail.el;
    NAF.utils.getNetworkedEntity(el).then((networkedEl) => {
      if (NAF.connection.isConnected()) {
        const networkedData = networkedEl.components.networked.data;
        const data = {
          eventType: 'persistentEntityCreated',
          networkId: networkedData.networkId,
          template: networkedData.template
        };
        NAF.connection.broadcastDataGuaranteed('events', data);
      }
    });
  }
});
