import { Col, Row } from "antd";

interface AssessmentHeaderProps {
  onClearAllFilters: () => void;
}

export default function AssessmentHeader({
  onClearAllFilters,
}: AssessmentHeaderProps) {
  return (
    <Row
      align="middle"
      justify="space-between"
      className="flex-col sm:flex-row gap-4 sm:gap-0"
    >
      <Col xs={24} sm={12} md={16}>
        <Row>
          <Col>
            <div
              className="text-lg md:text-xl"
              style={{
                fontFamily: "Helvetica_Neue-Medium, Helvetica",
                fontWeight: "700",
                color: "var(--text-primary)",
                cursor: "pointer",
              }}
              onClick={onClearAllFilters}
            >
             Cognitive Assessments
            </div>
            {/* <p
              className="!mt-1 text-sm sm:text-base"
              style={{
                fontFamily: "Helvetica_Neue-Regular, Helvetica",
                fontWeight: "400",
                color: "var(--text-secondary)",
              }}
            >
              Create, manage, and track assessments to evaluate candidate skills
              and performance.
            </p> */}
          </Col>
        </Row>
      </Col>

    </Row>
  );
}

