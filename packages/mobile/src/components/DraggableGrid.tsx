import React, { useCallback, useState } from 'react';
import { Dimensions, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  type SharedValue,
} from 'react-native-reanimated';

const COLS = 2;
const SPACING = 12; // equal gap on all sides: left edge, right edge, between columns, between rows
const SCREEN_W = Dimensions.get('window').width;
export const TILE_W = (SCREEN_W - SPACING * (COLS + 1)) / COLS;

function tileLeft(idx: number): number {
  return SPACING + (idx % COLS) * (TILE_W + SPACING);
}

function tileTop(idx: number, itemH: number): number {
  return SPACING + Math.floor(idx / COLS) * (itemH + SPACING);
}

// Called from onEnd worklet — must be a worklet itself.
function nearestIndex(centerX: number, centerY: number, itemH: number, count: number): number {
  'worklet';
  const col = Math.max(
    0,
    Math.min(COLS - 1, Math.round((centerX - SPACING - TILE_W / 2) / (TILE_W + SPACING))),
  );
  const maxRow = Math.ceil(count / COLS) - 1;
  const row = Math.max(
    0,
    Math.min(maxRow, Math.round((centerY - SPACING - itemH / 2) / (itemH + SPACING))),
  );
  return Math.min(count - 1, row * COLS + col);
}

export interface DraggableGridProps<T> {
  data: T[];
  keyExtractor: (item: T) => string;
  renderItem: (item: T) => React.ReactNode;
  onReorder: (newData: T[]) => void;
  contentContainerStyle?: object;
  refreshControl?: React.ReactElement;
}

interface GridItemProps<T> {
  item: T;
  index: number;
  itemH: number;
  count: number;
  renderItem: (item: T) => React.ReactNode;
  onDragEnd: (from: number, to: number) => void;
  draggingIndex: SharedValue<number>;
  dragOffsetX: SharedValue<number>;
  dragOffsetY: SharedValue<number>;
}

function GridItem<T,>({
  item,
  index,
  itemH,
  count,
  renderItem,
  onDragEnd,
  draggingIndex,
  dragOffsetX,
  dragOffsetY,
}: GridItemProps<T>) {
  const bx = tileLeft(index);
  const by = tileTop(index, itemH);

  const gesture = Gesture.Pan()
    .activateAfterLongPress(300)
    .onStart(() => {
      draggingIndex.value = index;
      dragOffsetX.value = 0;
      dragOffsetY.value = 0;
    })
    .onChange(e => {
      dragOffsetX.value += e.changeX;
      dragOffsetY.value += e.changeY;
    })
    .onEnd((_, success) => {
      if (success) {
        const toIdx = nearestIndex(
          bx + TILE_W / 2 + dragOffsetX.value,
          by + itemH / 2 + dragOffsetY.value,
          itemH,
          count,
        );
        draggingIndex.value = -1;
        if (toIdx !== index) {
          dragOffsetX.value = 0;
          dragOffsetY.value = 0;
          runOnJS(onDragEnd)(index, toIdx);
        } else {
          dragOffsetX.value = withSpring(0);
          dragOffsetY.value = withSpring(0);
        }
      } else {
        draggingIndex.value = -1;
        dragOffsetX.value = withSpring(0);
        dragOffsetY.value = withSpring(0);
      }
    });

  // Use transform (translateX/Y) for drag movement — transforms are purely visual
  // and don't trigger Yoga layout recalculation, unlike updating left/top.
  // position:'absolute', left, top are static so Yoga places the item correctly
  // from the very first layout pass.
  const animStyle = useAnimatedStyle(() => {
    const isDragging = draggingIndex.value === index;
    return {
      zIndex: isDragging ? 100 : 1,
      opacity: isDragging ? 0.92 : 1,
      transform: isDragging
        ? [{ translateX: dragOffsetX.value }, { translateY: dragOffsetY.value }, { scale: 1.05 }]
        : [{ translateX: 0 }, { translateY: 0 }, { scale: 1 }],
    };
  });

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        style={[{ position: 'absolute', left: bx, top: by, width: TILE_W }, animStyle]}
      >
        {renderItem(item)}
      </Animated.View>
    </GestureDetector>
  );
}

export function DraggableGrid<T,>({
  data,
  keyExtractor,
  renderItem,
  onReorder,
  contentContainerStyle,
  refreshControl,
}: DraggableGridProps<T>) {
  const [itemH, setItemH] = useState(0);
  const draggingIndex = useSharedValue(-1);
  const dragOffsetX = useSharedValue(0);
  const dragOffsetY = useSharedValue(0);

  const handleDragEnd = useCallback(
    (from: number, to: number) => {
      const newData = [...data];
      const [moved] = newData.splice(from, 1);
      newData.splice(to, 0, moved);
      onReorder(newData);
    },
    [data, onReorder],
  );

  const numRows = Math.ceil(data.length / COLS);
  const gridH = itemH > 0 ? SPACING * (numRows + 1) + numRows * itemH : 0;

  return (
    <ScrollView contentContainerStyle={contentContainerStyle} refreshControl={refreshControl}>
      {/* Probe stays mounted so it re-measures when tile content changes height
          (e.g. after quotes load: loading spinner → full price + sparkline). */}
      {data.length > 0 && (
        <View
          style={{ opacity: 0, width: TILE_W, position: 'absolute', top: -9999 }}
          onLayout={e => {
            const h = Math.ceil(e.nativeEvent.layout.height);
            if (h > 0 && h !== itemH) setItemH(h);
          }}
          pointerEvents="none"
        >
          {renderItem(data[0])}
        </View>
      )}
      {itemH > 0 && (
        <View style={{ height: gridH }}>
          {data.map((item, index) => (
            <GridItem
              key={keyExtractor(item)}
              item={item}
              index={index}
              itemH={itemH}
              count={data.length}
              renderItem={renderItem}
              onDragEnd={handleDragEnd}
              draggingIndex={draggingIndex}
              dragOffsetX={dragOffsetX}
              dragOffsetY={dragOffsetY}
            />
          ))}
        </View>
      )}
    </ScrollView>
  );
}
