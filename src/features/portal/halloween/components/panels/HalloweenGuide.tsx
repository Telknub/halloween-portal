import React from "react";

import { useAppTranslation } from "lib/i18n/useAppTranslations";
import { SquareIcon } from "components/ui/SquareIcon";
import { Label } from "components/ui/Label";
import {
  INSTRUCTIONS,
  RESOURCES_TABLE,
  ENEMIES_TABLE,
  STATUE_TABLE,
  RELICS_TABLE,
  BONE_TALBLE,
} from "../../HalloweenConstants";
import { useSound } from "lib/utils/hooks/useSound";

const PORTAL_NAME = "halloween";

type Props = {
  onBack?: () => void;
};

export const HalloweenGuide: React.FC<Props> = ({ onBack }) => {
  const { t } = useAppTranslation();

  const button = useSound("button");

  return (
    <div className="flex flex-col gap-1 max-h-[75vh]">
      {/* title */}
      <div className="flex flex-col gap-1">
        <div className="flex text-center">
          <div className="grow mb-3 text-lg">{t(`${PORTAL_NAME}.guide`)}</div>
        </div>
      </div>

      {/* content */}
      <div className="flex flex-col gap-1 overflow-y-auto scrollable pr-1">
        {/* Instructions */}
        <Label type="default">{t(`${PORTAL_NAME}.instructions`)}</Label>
        {INSTRUCTIONS.map(({ image, description, width = 10 }, index) => (
          <div key={index}>
            <div className="flex items-center mb-3 mx-2">
              <SquareIcon icon={image} width={width} />
              <p className="text-xs ml-3 flex-1">
                {t(`${PORTAL_NAME}.guideDescription`, {
                  description: description,
                })}
              </p>
            </div>
          </div>
        ))}
        {/* Resources */}
        <Label type="default">{t(`${PORTAL_NAME}.resources`)}</Label>
        <table className="w-full text-xs table-fixed border-collapse">
          <tbody>
            {RESOURCES_TABLE.map(
              ({ image, description, width = 13 }, index) => (
                <tr key={index}>
                  <td
                    style={{ border: "1px solid #b96f50" }}
                    className="p-1.5 w-1/6"
                  >
                    <div className="flex items-center justify-center">
                      {<SquareIcon icon={image} width={width} />}
                    </div>
                  </td>
                  <td
                    style={{ border: "1px solid #b96f50" }}
                    className="p-1.5 w-5/6"
                  >
                    {t(`${PORTAL_NAME}.guideDescription`, {
                      description: description,
                    })}
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>
        {/* Enemies */}
        <Label type="default">{t(`${PORTAL_NAME}.enemies`)}</Label>
        <table className="w-full text-xs table-fixed border-collapse">
          <tbody>
            {ENEMIES_TABLE.map(({ image, description, width = 13 }, index) => (
              <tr key={index}>
                <td
                  style={{ border: "1px solid #b96f50" }}
                  className="p-1.5 w-1/6"
                >
                  <div className="flex items-center justify-center">
                    {<SquareIcon icon={image} width={width} />}
                  </div>
                </td>
                <td
                  style={{ border: "1px solid #b96f50" }}
                  className="p-1.5 w-5/6"
                >
                  {t(`${PORTAL_NAME}.guideDescription`, {
                    description: description,
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {/* List of relics */}
        <Label type="default">{t(`${PORTAL_NAME}.relicsDescription`)}</Label>
        <table className="w-full text-xs table-fixed border-collapse">
          <tbody>
            {RELICS_TABLE.map(({ image, description, width = 13 }, index) => (
              <tr key={index}>
                <td
                  style={{ border: "1px solid #b96f50" }}
                  className="p-1.5 w-1/6"
                >
                  <div className="flex items-center justify-center">
                    {<SquareIcon icon={image} width={width} />}
                  </div>
                </td>
                <td
                  style={{ border: "1px solid #b96f50" }}
                  className="p-1.5 w-5/6"
                >
                  {t(`${PORTAL_NAME}.guideDescription`, {
                    description: description,
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {/* Statue buffs and debuffs */}
        <Label type="default">{t(`${PORTAL_NAME}.statueDescription`)}</Label>
        <table className="w-full text-xs table-fixed border-collapse">
          <tbody>
            {STATUE_TABLE.map(({ image, description, width = 13 }, index) => (
              <tr key={index}>
                <td
                  style={{ border: "1px solid #b96f50" }}
                  className="p-1.5 w-1/6"
                >
                  <div className="flex items-center justify-center">
                    {<SquareIcon icon={image} width={width} />}
                  </div>
                </td>
                <td
                  style={{ border: "1px solid #b96f50" }}
                  className="p-1.5 w-5/6"
                >
                  {t(`${PORTAL_NAME}.guideDescription`, {
                    description: description,
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Label type="default">{t(`${PORTAL_NAME}.bones`)}</Label>
        <table className="w-full text-xs table-fixed border-collapse">
          <table className="w-full text-xs table-fixed border-collapse">
            <tbody>
              <tr>
                {BONE_TALBLE.map(({ image, width = 13 }, index) => (
                  <td
                    key={index}
                    style={{ border: "1px solid #b96f50" }}
                    className="p-1.5"
                  >
                    <div className="flex items-center justify-center">
                      <SquareIcon icon={image} width={width} />
                    </div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </table>
      </div>
    </div>
  );
};
