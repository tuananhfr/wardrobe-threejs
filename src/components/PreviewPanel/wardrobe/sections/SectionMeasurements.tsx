import React from "react";

import { Text } from "@react-three/drei";

interface SectionMeasurementsProps {
  sections: {
    sectionA: WardrobeSection;
    sectionB?: WardrobeSection;
    sectionC?: WardrobeSection;
  };
  height: number;

  thickness: number;
  wardrobeType: string;
  showMeasurements: boolean;
}

const SectionMeasurements: React.FC<SectionMeasurementsProps> = ({
  sections,
  height,
  thickness,
  wardrobeType,
  showMeasurements,
}) => {
  // Nếu không hiển thị measurements thì return null
  if (!showMeasurements) {
    return null;
  }

  const measurementOffset = 0.3; // Khoảng cách từ tủ đến đường đo
  const textOffset = 0.05; // Khoảng cách từ đường đo đến text
  const lineHeight = 0.01; // Chiều cao của đường đo

  // Hàm tạo đường đo cho một section
  const createMeasurementLines = (
    sectionName: string,
    startX: number,
    startY: number,
    startZ: number,
    sectionWidth: number,
    rotation?: number,
    textRotation?: number
  ) => {
    const sectionWidthInCm = sectionWidth * 100; // Chuyển từ meters sang cm

    return (
      <group key={sectionName} rotation={[0, rotation || 0, 0]}>
        {/* Đường đo ngang */}
        <mesh position={[startX + sectionWidth / 2, startY, startZ]}>
          <boxGeometry args={[sectionWidth, lineHeight, lineHeight]} />
          <meshBasicMaterial color="#333333" />
        </mesh>

        {/* Đường đo dọc bên trái */}
        <mesh position={[startX, startY - lineHeight / 2, startZ]}>
          <boxGeometry args={[lineHeight, lineHeight * 3, lineHeight]} />
          <meshBasicMaterial color="#333333" />
        </mesh>

        {/* Đường đo dọc bên phải */}
        <mesh
          position={[startX + sectionWidth, startY - lineHeight / 2, startZ]}
        >
          <boxGeometry args={[lineHeight, lineHeight * 3, lineHeight]} />
          <meshBasicMaterial color="#333333" />
        </mesh>

        {/* Text hiển thị kích thước */}
        <Text
          position={[startX + sectionWidth / 2, startY + textOffset, startZ]}
          fontSize={0.08}
          color="#333333"
          anchorX="center"
          anchorY="bottom"
          rotation={textRotation ? [0, textRotation, 0] : [0, 0, 0]}
        >
          {`${sectionWidthInCm.toFixed(0)} cm`}
        </Text>

        {/* Text hiển thị tên section */}
        <Text
          position={[
            startX + sectionWidth / 2,
            startY - textOffset - 0.1,
            startZ,
          ]}
          fontSize={0.06}
          color="#666666"
          anchorX="center"
          anchorY="top"
          rotation={textRotation ? [0, textRotation, 0] : [0, 0, 0]}
        >
          {sectionName === "sectionA"
            ? "Section A"
            : sectionName === "sectionB"
            ? "Section B"
            : "Section C"}
        </Text>
      </group>
    );
  };

  // ✅ THÊM THAM SỐ suffix để tạo unique keys
  const createDepthMeasurement = (
    sectionName: string,
    startX: number,
    startY: number,
    startZ: number,
    sectionDepth: number,
    rotation?: number,
    textRotation?: number,
    textPosition: "left" | "right" | "top" = "left",
    suffix: string = "" // ✅ Tham số mới để tạo unique key
  ) => {
    const sectionDepthInCm = sectionDepth * 100; // Chuyển từ meters sang cm

    // Xác định vị trí text dựa trên textPosition
    let textX = startX;
    let textY = startY;
    let textZ = startZ + sectionDepth / 2;
    let textAnchorX: "left" | "right" | "center" = "center";
    let textAnchorY: "top" | "middle" | "bottom" = "middle";

    if (textPosition === "left") {
      textX = startX - textOffset;
      textAnchorX = "right";
      textAnchorY = "middle";
    } else if (textPosition === "right") {
      textX = startX + textOffset;
      textAnchorX = "left";
      textAnchorY = "middle";
    } else if (textPosition === "top") {
      textY = startY + textOffset;
      textAnchorX = "center";
      textAnchorY = "bottom";
    }

    // ✅ Sử dụng suffix để tạo unique key
    const uniqueKey = `${sectionName}-depth${suffix ? `-${suffix}` : ""}`;

    return (
      <group key={uniqueKey} rotation={[0, rotation || 0, 0]}>
        {/* Đường đo độ sâu */}
        <mesh position={[startX, startY, startZ + sectionDepth / 2]}>
          <boxGeometry args={[lineHeight, lineHeight, sectionDepth]} />
          <meshBasicMaterial color="#333333" />
        </mesh>

        {/* Đường đo ngang phía trước */}
        <mesh position={[startX, startY, startZ]}>
          <boxGeometry args={[lineHeight * 3, lineHeight, lineHeight]} />
          <meshBasicMaterial color="#333333" />
        </mesh>

        {/* Đường đo ngang phía sau */}
        <mesh position={[startX, startY, startZ + sectionDepth]}>
          <boxGeometry args={[lineHeight * 3, lineHeight, lineHeight]} />
          <meshBasicMaterial color="#333333" />
        </mesh>

        {/* Text hiển thị độ sâu */}
        <Text
          position={[textX, textY, textZ]}
          fontSize={0.08}
          color="#333333"
          anchorX={textAnchorX}
          anchorY={textAnchorY}
          rotation={textRotation ? [0, textRotation, 0] : [0, 0, 0]}
        >
          {`${sectionDepthInCm.toFixed(0)} cm`}
        </Text>
      </group>
    );
  };

  // Hàm tạo đường đo chiều cao chung
  const createHeightMeasurement = (
    startX: number = 0,
    startY: number = 0,
    startZ: number = 0,
    textRotation?: number
  ) => {
    const heightInCm = height * 100;

    return (
      <group key="height-measurement">
        {/* Đường đo dọc (chiều cao) */}
        <mesh position={[startX, -2 * lineHeight - thickness, startZ]}>
          <boxGeometry args={[lineHeight, height - lineHeight, lineHeight]} />
          <meshBasicMaterial color="#333333" />
        </mesh>

        {/* Đường đo ngang phía dưới */}
        <mesh position={[startX, -height / 2 - lineHeight - thickness, startZ]}>
          <boxGeometry args={[lineHeight * 3, lineHeight, lineHeight]} />
          <meshBasicMaterial color="#333333" />
        </mesh>

        {/* Đường đo ngang phía trên */}
        <mesh
          position={[startX, height / 2 - 2 * lineHeight - thickness, startZ]}
        >
          <boxGeometry args={[lineHeight * 3, lineHeight, lineHeight]} />
          <meshBasicMaterial color="#333333" />
        </mesh>

        {/* Text hiển thị chiều cao */}
        <Text
          position={[startX - textOffset, startY + height / 2, startZ]}
          fontSize={0.08}
          color="#333333"
          anchorX="right"
          anchorY="middle"
          rotation={textRotation ? [0, textRotation, 0] : [0, 0, 0]}
        >
          {`${heightInCm.toFixed(0)} cm`}
        </Text>
      </group>
    );
  };

  // Tính toán vị trí các section dựa trên loại tủ
  const renderMeasurements = () => {
    switch (wardrobeType) {
      case "Linéaire":
        const measurements = [];

        // Section A
        measurements.push(
          createMeasurementLines(
            "sectionA",
            -sections.sectionA.width / 2,
            -height / 2,
            sections.sectionA.depth / 2 + thickness / 2 + measurementOffset,
            sections.sectionA.width
          )
        );

        // Đường đo độ sâu cho Section A
        measurements.push(
          createDepthMeasurement(
            "sectionA",
            -sections.sectionA.width / 2 - measurementOffset / 2,
            -height / 2,
            -sections.sectionA.depth / 2,
            sections.sectionA.depth,
            undefined,
            undefined,
            "left"
          )
        );

        // Thêm đường đo chiều cao chung
        measurements.push(
          createHeightMeasurement(
            -sections.sectionA.width / 2,
            -height / 2,
            sections.sectionA.depth / 2 + measurementOffset / 2
          )
        );

        return measurements;

      case "Angle":
        // Cho tủ góc, hiển thị từng section theo vị trí thực tế
        const angleMeasurements = [];

        // Section A - phần ngang
        angleMeasurements.push(
          createMeasurementLines(
            "sectionA",
            -sections.sectionA.width / 2,
            -height / 2,
            sections.sectionA.depth / 2 +
              thickness / 2 +
              measurementOffset +
              sections.sectionB!.width,
            sections.sectionA.width
          )
        );

        // Đường đo độ sâu cho Section A
        angleMeasurements.push(
          createDepthMeasurement(
            "sectionA",
            -sections.sectionA.width / 2 - measurementOffset / 2,
            -height / 2,
            -sections.sectionA.depth / 2,
            sections.sectionA.depth,
            undefined,
            undefined,
            "left"
          )
        );

        // Section B - phần dọc
        if (sections.sectionB) {
          angleMeasurements.push(
            createMeasurementLines(
              "sectionB",
              -sections.sectionA.depth / 2 - sections.sectionB.width,
              -height / 2,
              sections.sectionA.depth / 2 +
                sections.sectionB.width / 2 +
                measurementOffset,
              sections.sectionB.width,
              Math.PI / 2 // Xoay 90 độ
            )
          );

          // Đường đo độ sâu cho Section B
          angleMeasurements.push(
            createDepthMeasurement(
              "sectionB",
              -sections.sectionA.depth / 2 -
                sections.sectionB.width -
                measurementOffset / 2,
              -height / 2 + measurementOffset / 2,
              sections.sectionA.width / 2 - sections.sectionB.depth,
              sections.sectionB.depth,
              Math.PI / 2,
              -Math.PI / 2,
              "left"
            )
          );
        }

        // Thêm đường đo chiều cao chung
        angleMeasurements.push(
          createHeightMeasurement(
            -sections.sectionA.width / 2,
            -height / 2,
            sections.sectionA.depth / 2 + measurementOffset / 2
          )
        );

        return angleMeasurements;

      case "Forme U":
        // Cho tủ hình U, hiển thị từng section theo vị trí thực tế
        const uMeasurements = [];

        // Section A - phần giữa (ngang)
        uMeasurements.push(
          createMeasurementLines(
            "sectionA",
            -sections.sectionA.width / 2,
            -height / 2,
            sections.sectionA.depth / 2 +
              thickness / 2 +
              measurementOffset +
              sections.sectionB!.width,
            sections.sectionA.width
          )
        );

        // ✅ Đường đo độ sâu cho Section A (bên trái) - thêm suffix "left"
        uMeasurements.push(
          createDepthMeasurement(
            "sectionA",
            -sections.sectionA.width / 2 - measurementOffset / 2,
            -height / 2 + measurementOffset / 2,
            -sections.sectionA.depth / 2,
            sections.sectionA.depth,
            undefined,
            undefined,
            "left",
            "left" // ✅ Thêm suffix để phân biệt
          )
        );

        // ✅ Đường đo độ sâu cho Section A (bên phải) - thêm suffix "right"
        uMeasurements.push(
          createDepthMeasurement(
            "sectionA",
            sections.sectionA.width / 2 + measurementOffset / 2,
            -height / 2 + measurementOffset / 2,
            -sections.sectionA.depth / 2,
            sections.sectionA.depth,
            undefined,
            undefined,
            "right",
            "right" // ✅ Thêm suffix để phân biệt
          )
        );

        // Section B - cánh trái
        if (sections.sectionB) {
          uMeasurements.push(
            createMeasurementLines(
              "sectionB",
              -sections.sectionA.depth / 2 - sections.sectionB.width,
              -height / 2,
              -sections.sectionA.width / 2 -
                sections.sectionB.depth / 2 -
                measurementOffset,
              sections.sectionB.width,
              Math.PI / 2,
              Math.PI
            )
          );

          // Đường đo độ sâu cho Section B
          uMeasurements.push(
            createDepthMeasurement(
              "sectionB",
              -sections.sectionA.depth / 2 -
                sections.sectionB.width -
                measurementOffset / 2,
              -height / 2 + measurementOffset / 2,
              -sections.sectionA.width / 2,
              sections.sectionB.depth,
              Math.PI / 2,
              -Math.PI / 2,
              "top"
            )
          );
        }

        // Section C - cánh phải
        if (sections.sectionC) {
          uMeasurements.push(
            createMeasurementLines(
              "sectionC",
              -sections.sectionA.depth / 2 - sections.sectionC!.width,
              -height / 2,
              sections.sectionA.width / 2 +
                sections.sectionC.depth / 2 +
                measurementOffset,
              sections.sectionC.width,
              Math.PI / 2
            )
          );

          // Đường đo độ sâu cho Section C
          uMeasurements.push(
            createDepthMeasurement(
              "sectionC",
              -sections.sectionA.depth / 2 -
                sections.sectionC!.width -
                measurementOffset / 2,
              -height / 2 + measurementOffset / 2,
              sections.sectionA.width / 2 - sections.sectionC.depth,
              sections.sectionC.depth,
              Math.PI / 2,
              -Math.PI / 2,
              "top"
            )
          );
        }

        // Thêm đường đo chiều cao chung
        uMeasurements.push(
          createHeightMeasurement(
            -sections.sectionA.width / 2,
            -height / 2,
            sections.sectionA.depth / 2 +
              sections.sectionB!.width +
              measurementOffset / 2
          )
        );

        return uMeasurements;

      default:
        return null;
    }
  };

  return <group>{renderMeasurements()}</group>;
};

export default SectionMeasurements;
