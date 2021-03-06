import React from 'react';
import {mount} from 'enzyme';

import {Client} from 'app/api';
import ConfigStore from 'app/stores/configStore';
import App from 'app/views/app';

describe('Sudo Modal', function() {
  beforeEach(function() {
    ConfigStore.set('messages', []);

    Client.clearMockResponses();
    Client.addMockResponse({
      url: '/internal/health/',
      body: {
        problems: [],
      },
    });
    Client.addMockResponse({
      url: '/organizations/',
      body: [TestStubs.Organization()],
    });
    Client.addMockResponse({
      url: '/organizations/org-slug/',
      method: 'DELETE',
      statusCode: 401,
      body: {
        sudoRequired: true,
      },
    });
  });

  afterEach(function() {
    // trigger.mockReset();
    ConfigStore.set('messages', []);
  });

  it('can delete an org with sudo flow', function(done) {
    mount(<App />);

    let api = new Client();
    let successCb = jest.fn();
    let errorCb = jest.fn();
    let orgDeleteMock;

    // No Modal
    expect($('.modal input').length).toBe(0);

    // Should return w/ `sudoRequired`
    api.request('/organizations/org-slug/', {
      method: 'DELETE',
      success: successCb,
      error: errorCb,
    });

    setTimeout(() => {
      try {
        // SudoModal
        const $input = $('.modal input');
        expect($input.length).toBe(1);

        // Original callbacks should not have been called
        expect(successCb).not.toBeCalled();
        expect(errorCb).not.toBeCalled();

        // Clear mocks and allow DELETE
        Client.clearMockResponses();
        orgDeleteMock = Client.addMockResponse({
          url: '/organizations/org-slug/',
          method: 'DELETE',
          statusCode: 200,
        });
        let sudoMock = Client.addMockResponse({
          url: '/sudo/',
          method: 'POST',
          statusCode: 200,
        });

        expect(sudoMock).not.toHaveBeenCalled();

        // "Sudo" auth
        $input.val('password');
        $('.modal [type="submit"]').click();

        expect(sudoMock).toHaveBeenCalledWith(
          '/sudo/',
          expect.objectContaining({
            method: 'POST',
            // XXX: This doesn't submit with password in tests because modal is rendered outside of
            // react tree. So we can't simulate react events on input
            // data: {
            // password: 'password',
            // },
          })
        );
      } catch (err) {
        done(err);
      }
      setTimeout(() => {
        try {
          // Modal can be around but should be "busy"

          // Retry API request
          expect(successCb).toHaveBeenCalled();
          expect(orgDeleteMock).toHaveBeenCalledWith(
            '/organizations/org-slug/',
            expect.objectContaining({
              method: 'DELETE',
            })
          );
        } catch (err) {
          done(err);
        }
        done();
      }, 1);
    }, 1);
  });
});
