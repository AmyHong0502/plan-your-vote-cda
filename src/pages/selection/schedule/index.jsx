import React, { Component } from 'react';
import pyvMap from 'apis/pyvMap';
import pyv from 'apis/pyv';
import Map from 'components/Map';
import SectionHeader from 'components/SectionHeader';
import Details from 'components/Map/Details';
import dummyHeader from 'constants/dummyData/pages.json';

class Schedule extends Component {
  _isMounted = false;
  _isDistanceFixed = false;

  state = {
    user: {
      latitude: 0,
      longitude: 0
    },
    allPollingPlaces: [
      {
        pollingPlaceId: 0,
        address: null,
        pollingPlaceName: null,
        pollingStationName: null,
        advanceOnly: false,
        localArea: null,
        pollingPlaceDates: [
          {
            startTime: null,
            endTime: null,
            pollingDate: null
          }
        ],
        parkingInfo: null,
        wheelchairInfo: null,
        email: null,
        phone: null,
        latitude: 0,
        longitude: 0
      }
    ],
    closePollingPlaces: []
  };

  componentDidMount() {
    this._isMounted = true;
    this.initializeUserCoordinates();
    this.loadPollingPlaces();
    this.loadDistance();
  }

  componentDidUpdate() {
    if (!this._isDistanceFixed) {
      this.loadDistance();
    }
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  initializeUserCoordinates = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(position => {
        const { latitude, longitude } = position.coords;
        this.setUserCoordinates(latitude, longitude);
      });
    } else {
      console.warn('Geolocation is not supported by this browser.');
    }
  };

  loadPollingPlaces = async () => {
    await pyv.get('/api/PollingPlaces').then(response => {
      if (this._isMounted) {
        this.setState({
          allPollingPlaces: response.data.pollingPlaces
        });
      }
    });
  };

  loadDistance = async () => {
    const { latitude, longitude } = this.state.user;
    if (latitude === 0 && longitude === 0) {
      return;
    }

    await pyvMap.get(`/api/map/${longitude},${latitude}`).then(response => {
      this.mapDistance(response.data);
    });
  };

  mapDistance = distances => {
    if (
      !distances ||
      this.state.allPollingPlaces.length === 0 ||
      distances.length === 0
    ) {
      return;
    }

    const result = [];

    distances.map(distance => {
      const place = this.state.allPollingPlaces.find(pollingPlace => {
        return pollingPlace.pollingPlaceId === distance.pollingPlaceID;
      });

      if (place) {
        place['distance'] = distance.distance;
        result.push(place);
      }

      return null;
    });

    if (this._isMounted) {
      this.setState({
        closePollingPlaces: result
      });
      this._isDistanceFixed = true;
    }
  };

  setUserCoordinates = (latitude, longitude) => {
    if (this._isMounted) {
      this._isDistanceFixed = false;
      this.setState({
        user: {
          latitude,
          longitude
        }
      });
    }
  };

  render() {
    const details = this.state.closePollingPlaces.map(pollingPlace => {
      return (
        <li className='list-group-item' key={pollingPlace.pollingPlaceId}>
          <Details pollingPlace={pollingPlace} />
        </li>
      );
    });

    return (
      <div className='container'>
        <div className='row'>
          <div className='col-12'>
            <SectionHeader
              title={dummyHeader[2].title}
              subtitle={dummyHeader[2].subtitle}
              level='2'
              description={dummyHeader[2].description}
            />
          </div>
          <div className='col-md-6'>
            <div className='input-group mb-3'>
              <div className='input-group-prepend'>
                <label className='input-group-text' htmlFor='votingdate'>
                  <i className='far fa-calendar-check' />
                </label>
              </div>
              <select className='custom-select form-control-sm' id='votingdate'>
                <option value='May 12, 2019'>May 12, 2019</option>
                <option value='May 13, 2019'>May 13, 2019</option>
                <option value='May 14, 2019'>May 14, 2019</option>
                <option value='May 15, 2019'>May 15, 2019</option>
              </select>
            </div>
            <Map
              pollingPlaces={this.state.closePollingPlaces}
              user={this.state.user}
              setUserCoordinates={this.setUserCoordinates}
              _isDistanceFixed={this._isDistanceFixed}
            />
          </div>
          <div className='col-md-6'>
            <ul className='list-group list-group-flush' id='station-list'>
              {details}
            </ul>
          </div>
        </div>
      </div>
    );
  }
}

export default Schedule;
