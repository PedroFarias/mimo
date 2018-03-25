import React from 'react';
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { stateManager } from '../state/StateManager';
import { Colors, Heights } from '../util/Constants';

/**
 * Renders a single category item. Basically, it's just a touchable button,
 * with a funny background.
 */
class CategoryItem extends React.Component {
  _onPress = () => this.props.onPress(this.props.category);

  render() {
    const selected = this.props.category.selected;
    const containerStyle = selected ? styles.category.containerSelected :
      styles.category.container;
    const textStyle = selected ? styles.category.textSelected :
      styles.category.text;

    const name = this.props.category.name ? this.props.category.name : 'Todas';

    return (
      <TouchableOpacity
        style={containerStyle}
        onPress={this._onPress}
      >
        <Text style={textStyle}>
          {name}
        </Text>
      </TouchableOpacity>
    );
  }
}

/**
 * Renders a CategoryBar, which consists of a scroll view of all possible
 * categories, each one stylized in its own way. This component keeps track
 * of which category is selected, and passes that information via the
 * onChange prop callback.
 */
export default class CategoryBar extends React.Component {
  componentWillMount() {
    this.categories = [];
    this._selected = 0;
  }

  /**
   * Gets all the categories from the internal state, by iterating over all
   * stores.
   *
   * Notice that this only gets called on componentWillMount(); this
   * assumes that no new categories will show up out of nowhere. It is possible
   * to allow this in the future, but I do not think it's worth the work.
   */
  _getCategories = () => {
    let categorySet = new Set();
    categorySet.add(null);

    const stores = stateManager.getStores();
    stores.forEach((store) => {
      store.categories.forEach((category) => {
        categorySet.add(category);
      });
    });

    return Array.from(categorySet.values()).map((category, index) => {
      return {
        uid: index,
        name: category,
        selected: (index == this._selected)
      };
    });
  }

  /**
   * Callback triggered when a new category is chosen. Calls the callback
   * given by the prop onChange.
   */
  _onChange = (category) => this.props.onChange(category);

  /**
   * Callback triggered when a category item is pressed. Updates the internal
   * state of this component, and calls _onChange.
   */
  _onPressItem = (item) => {
    this._selected = item.uid;
    this._onChange(item.name);
    this.forceUpdate();
  }

  // Renders an item on the list, by using a CategoryItem component.
  _renderItem = ({item}) => {
    return (
      <CategoryItem
        category={item}
        onPress={this._onPressItem}
      />
    );
  }

  // Extracts the key form the items in the data array of the list.
  _keyExtractor = (item) => item.uid;

  render() {
    const categories = this._getCategories();

    return (
      <View style={styles.layout.container}>
        <FlatList
          horizontal
          data={categories}
          renderItem={this._renderItem}
          keyExtractor={this._keyExtractor}
          contentContainerStyle={styles.layout.list}
        />
      </View>
    );
  }
}

const styles = {
  layout: StyleSheet.create({
    container: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      height: Heights.CategoryBar,
      width: '100%',
      zIndex: 9,
      elevation: 2,
      backgroundColor: Colors.White,
      shadowOffset: {width: 0, height: 0},
      shadowColor: Colors.Black,
      shadowOpacity: 0.3,
      shadowRadius: 3,
    },
    list: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
  }),
  category: StyleSheet.create({
    containerSelected: {
      backgroundColor: '#2eb2ff',
      borderRadius: 5,
      padding: 7,
      margin: 5,
    },
    container: {
      backgroundColor: '#fff',
      borderRadius: 5,
      padding: 7,
      margin: 5,
    },
    textSelected: {
      color: '#fff',
      fontFamily: 'josefin-sans-bold',
    },
    text: {
      color: '#2eb2ff',
      fontFamily: 'josefin-sans-bold',
    },
  }),
}
