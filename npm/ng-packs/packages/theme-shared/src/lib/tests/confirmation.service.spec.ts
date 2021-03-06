import { CoreModule } from '@abp/ng.core';
import { NgModule } from '@angular/core';
import { fakeAsync, tick } from '@angular/core/testing';
import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { NgxsModule } from '@ngxs/store';
import { timer } from 'rxjs';
import { take } from 'rxjs/operators';
import { ConfirmationComponent } from '../components';
import { Confirmation } from '../models';
import { ConfirmationService } from '../services';

@NgModule({
  exports: [ConfirmationComponent],
  entryComponents: [ConfirmationComponent],
  declarations: [ConfirmationComponent],
  imports: [CoreModule.forTest()],
})
export class MockModule {}

describe('ConfirmationService', () => {
  let spectator: SpectatorService<ConfirmationService>;
  let service: ConfirmationService;
  const createService = createServiceFactory({
    service: ConfirmationService,
    imports: [NgxsModule.forRoot(), CoreModule.forTest(), MockModule],
  });

  beforeEach(() => {
    spectator = createService();
    service = spectator.service;
  });

  afterEach(() => {
    clearElements();
  });

  test('should display a confirmation popup', fakeAsync(() => {
    service.show('MESSAGE', 'TITLE');

    tick();

    expect(selectConfirmationContent('.title')).toBe('TITLE');
    expect(selectConfirmationContent('.message')).toBe('MESSAGE');
  }));

  test.each`
    type         | selector      | icon
    ${'info'}    | ${'.info'}    | ${'.fa-info-circle'}
    ${'success'} | ${'.success'} | ${'.fa-check-circle'}
    ${'warn'}    | ${'.warning'} | ${'.fa-exclamation-triangle'}
    ${'error'}   | ${'.error'}   | ${'.fa-times-circle'}
  `('should display $type confirmation popup', async ({ type, selector, icon }) => {
    service[type]('MESSAGE', 'TITLE');

    await timer(0).toPromise();

    expect(selectConfirmationContent('.title')).toBe('TITLE');
    expect(selectConfirmationContent('.message')).toBe('MESSAGE');
    expect(selectConfirmationElement(selector)).toBeTruthy();
    expect(selectConfirmationElement(icon)).toBeTruthy();
  });

  test('should close with ESC key', done => {
    service
      .info('', '')
      .pipe(take(1))
      .subscribe(status => {
        expect(status).toBe(Confirmation.Status.dismiss);
        done();
      });

    const escape = new KeyboardEvent('keyup', { key: 'Escape' });
    document.dispatchEvent(escape);
  });

  test('should close when click cancel button', async done => {
    service.info('', '', { yesText: 'Sure', cancelText: 'Exit' }).subscribe(status => {
      expect(status).toBe(Confirmation.Status.reject);
      done();
    });

    await timer(0).toPromise();

    expect(selectConfirmationContent('button#cancel')).toBe('Exit');
    expect(selectConfirmationContent('button#confirm')).toBe('Sure');

    selectConfirmationElement<HTMLButtonElement>('button#cancel').click();
  });
});

function clearElements(selector = '.confirmation') {
  document.querySelectorAll(selector).forEach(element => element.parentNode.removeChild(element));
}

function selectConfirmationContent(selector = '.confirmation'): string {
  return selectConfirmationElement(selector).textContent.trim();
}

function selectConfirmationElement<T extends HTMLElement>(selector = '.confirmation'): T {
  return document.querySelector(selector);
}
