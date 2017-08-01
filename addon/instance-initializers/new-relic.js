import Ember from 'ember';

export function initialize() {
  const { NREUM } = window;

  if (!NREUM) {
    return;
  }

  function mustIgnoreError(error) {
    // Ember 2.X seems to not catch `TransitionAborted` errors caused by regular redirects. We don't want these errors to show up in NewRelic so we have to filter them ourselfs.
    // Once the issue https://github.com/emberjs/ember.js/issues/12505 is resolved we can remove this ignored error.
    if (Ember.isNone(error)) {
      return false;
    }
    const errorName = Ember.get(error, 'name');
    return errorName === 'TransitionAborted';
  }

  function handleError(error) {
    if (mustIgnoreError(error)) {
      return;
    }

    if (Ember.typeOf(error) === 'error'){
      if(error.nrNoticed) {
        return;
      }else{
        error.nrNoticed = true;
      }
    }

    try {
      NREUM.noticeError(error);
    } catch(e) {
      // Ignore
    }

    console.error(error);
  }

  function generateError(cause, stack) {
    const error = new Error(cause);

    error.stack = stack;

    return error;
  }

  const _oldOnerror = Ember.onerror;
  Ember.onerror = function(error) {
    if (Ember.typeOf(_oldOnerror) === 'function') {
      _oldOnerror.call(this, error);
    }
    handleError(error);
  };

  Ember.RSVP.on('error', handleError);

  Ember.Logger.error = function(...messages) {
    handleError(generateError(messages.join(' ')));
  };
}

export default {
  name: 'new-relic',
  initialize
};
