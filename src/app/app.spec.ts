import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([])]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the skip link targeting #main-content', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const skipLink = fixture.nativeElement.querySelector('a[href="#main-content"]');
    expect(skipLink).toBeTruthy();
    expect(skipLink.textContent).toContain('Saltar al contenido principal');
  });
});