import Bay from 'bay';
import App from './app';
import config from 'config';

const bay = new Bay(App);
bay.listen(9000);
