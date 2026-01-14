# Ant Design to shadcn/ui Migration Guide

## Progress Summary

✅ **Completed:**
- shadcn/ui setup and configuration
- Core utility components created (message, spin, typography, layout, grid, date-picker, input-number, tag, space)
- Replaced antd in UI component files:
  - LeftSideBarMenu.tsx
  - LeftSideBar.tsx
  - Header.tsx
  - CustomSelect.tsx
  - ThemeToggle.tsx
  - CustomDatePicker.tsx
  - Toster.tsx
  - UserLayout.tsx
  - ThemeAwareConfig.tsx

## Component Mapping

### Direct Replacements
- `Button` → `@/components/ui/button`
- `Input` → `@/components/ui/input`
- `Select` → `@/components/ui/select`
- `Card` → `@/components/ui/card`
- `Modal` → `@/components/ui/dialog`
- `Avatar` → `@/components/ui/avatar`
- `Badge` → `@/components/ui/badge`
- `Tabs` → `@/components/ui/tabs`
- `Table` → `@/components/ui/table`
- `Form` → `@/components/ui/form`
- `Checkbox` → `@/components/ui/checkbox`
- `Switch` → `@/components/ui/switch`
- `Textarea` → `@/components/ui/textarea`
- `Dropdown` → `@/components/ui/dropdown-menu`
- `Separator` → `@/components/ui/separator` (for Divider)
- `Skeleton` → `@/components/ui/skeleton` (for Spin)
- `Alert` → `@/components/ui/alert`
- `Slider` → `@/components/ui/slider`
- `Radio` → `@/components/ui/radio-group`
- `Collapse` → `@/components/ui/collapsible`
- `Empty` → `@/components/ui/empty`
- `Tooltip` → `@/components/ui/tooltip`
- `Popover` → `@/components/ui/popover`
- `Breadcrumb` → `@/components/ui/breadcrumb`
- `Calendar` → `@/components/ui/calendar`

### Custom Utility Components
- `message` → `@/components/ui/message` (uses react-hot-toast)
- `Spin` → `@/components/ui/spin`
- `Typography` (Title, Paragraph, Text) → `@/components/ui/typography`
- `Layout`, `Sider`, `Content` → `@/components/ui/layout`
- `Row`, `Col` → `@/components/ui/grid`
- `DatePicker` → `@/components/ui/date-picker`
- `InputNumber` → `@/components/ui/input-number`
- `Tag` → `@/components/ui/tag`
- `Space` → `@/components/ui/space`

### Icons
- `@ant-design/icons` → `lucide-react`
- Common mappings:
  - `ArrowLeftOutlined` → `ArrowLeft`
  - `PlusOutlined` → `Plus`
  - `SearchOutlined` → `Search`
  - `MoreOutlined` → `MoreVertical`
  - `DeleteOutlined` → `Trash2`
  - `EditOutlined` → `Edit`
  - `EyeOutlined` → `Eye`
  - `CalendarOutlined` → `Calendar`
  - `DownOutlined` → `ChevronDown`
  - `FileTextFilled` → `FileText`
  - `SunOutlined` → `Sun`
  - `MoonOutlined` → `Moon`

## Remaining Files to Migrate

Approximately 60+ files still need migration. Common patterns:

1. **Form Components** - Replace `Form`, `Form.Item` with shadcn form
2. **Table Components** - Replace `Table`, `Table.Column` with shadcn table
3. **Modal Components** - Replace `Modal` with `Dialog`
4. **Upload Components** - Need custom upload component (see below)
5. **Tree Components** - Need custom tree component or use a library
6. **AutoComplete** - Use Input + Popover combination
7. **Segmented** - Use Tabs or create custom component
8. **Result** - Create custom component for error/success pages

## Migration Steps for Each File

1. **Replace imports:**
   ```tsx
   // Before
   import { Button, Input, Modal } from "antd";
   import { PlusOutlined } from "@ant-design/icons";
   
   // After
   import { Button } from "@/components/ui/button";
   import { Input } from "@/components/ui/input";
   import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
   import { Plus } from "lucide-react";
   ```

2. **Replace components:**
   - `Modal` → `Dialog` (with DialogContent, DialogHeader, DialogTitle)
   - `message.success()` → `message.success()` (from our utility)
   - `Spin` → `Spin` (from our utility)
   - `Row/Col` → `Row/Col` (from our utility)

3. **Update props:**
   - Modal `open` → Dialog `open`
   - Modal `onCancel` → Dialog `onOpenChange`
   - Remove antd-specific props

4. **Update styling:**
   - Remove `!important` overrides where possible
   - Use Tailwind classes instead of inline styles
   - Update className patterns

## Next Steps

1. Continue migrating files systematically
2. Test each component after migration
3. Remove antd from package.json once all files are migrated
4. Clean up any remaining antd CSS references in index.css

