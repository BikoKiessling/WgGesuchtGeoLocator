import React from 'react';

let map: google.maps.Map;

class Geofinder extends React.Component {
  async componentDidMount() {
    await this.initMap();
  }

  getData = async (
    currentIndex: number = 0,
    maxPage?: number,
  ): Promise<{ links: string[]; addresses: string[] }> => {
    let addresses: string[];
    let links: string[];
    const data = await fetch(this.getDataUrl(currentIndex));
    const text = await data.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/html');
    if (!maxPage) {
      // Todo this for some fcked up reason returns a different pagination layout when xhr requesting the resource than when manually loading it.
      /*    maxPages =
        parseInt(doc.querySelector('.pagination li:nth-last-child(2) a').innerText, 10) - 1; */
      maxPage = 3;
    }
    links = Array.from(
      doc.querySelectorAll(
        'div:not(.clicked_partner) > div >div.col-sm-8.card_body > div > div > h3 > a',
      ),
    ).map((a) => a.getAttribute('href'));

    addresses = Array.from(
      doc.querySelectorAll(
        'div:not(.clicked_partner) > div >div.col-sm-8.card_body > div > div.col-xs-11 > span:first-child',
      ),
    ).map((span) => span.innerText.split('|')[2].trim());

    if (currentIndex < maxPage) {
      currentIndex += 1;
      const data = await this.getData(currentIndex, maxPage);
      addresses = addresses.concat(data.addresses);
      links = links.concat(data.links);
    }

    return { addresses, links };
  };

  private getDataUrl(currentIndex: number) {
    return `https://www.wg-gesucht.de/wg-zimmer-in-Wien.163.0.1.${currentIndex}.html?category=0&city_id=163&rent_type=0&noDeact=1&rMax=600&ot=2991%2C3004&img=1&rent_types%5B0%5D=0`;
  }

  async initMap() {
    console.log('initMap');
    map = new google.maps.Map(document.getElementById('map'), {
      center: {
        lat: 48.210033,
        lng: 16.363449,
      },
      zoom: 12,
    });

    const { addresses, links } = await this.getData(0);
    console.log('addresses count', addresses.length);
    console.log('links count', links.length);
    addresses.forEach((address, index) => {
      //counteracts rate limiting by google
      setTimeout(() => {
        this.codeAddress(address, links[index]);
      }, 1000 * index);
    });

  }

  codeAddress(address, link) {
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address }, (results, status) => {
      console.log('status: ' + status);
      if (status === 'OK') {
        const latLng = {
          lat: results[0].geometry.location.lat(),
          lng: results[0].geometry.location.lng(),
        };
        const marker = new google.maps.Marker({
          position: latLng,
          map,
          label: address,
        });
        google.maps.event.addListener(marker, 'click', () => {
          window.open(`https://www.wg-gesucht.de/${link}`, '_blank').focus();
        });
      }
    });
  }

  render() {
    const style = {
      width: '100vw',
      height: '100vh',
    };
    return (
      <>
        well hello there
        <div id="map" style={style} />
        <script
          src="https://maps.googleapis.com/maps/api/js?key=AIzaSyCTVRFsn83kL-TDY64vuZr5G4L6-K8NPcw&v=weekly"
          async
        />
      </>
    );
  }
}

export default Geofinder;
