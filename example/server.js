import Bay from 'bay';
import App from './app';
import config from 'config';

new Bay(App).listen(config.site.port);
