import os

files = [
    'components/moments/MomentsHistoryView.tsx',
    'features/clarity/ClarityHistoryView.tsx',
    'features/clarity/components/ClarityResultsDashboard.tsx',
    'features/conditions/ConditionDetailView.tsx',
    'features/conditions/ConditionsLibraryView.tsx',
    'features/mindmate/components/MindMateView.tsx',
    'features/mood-journal/AddMomentSheet.tsx',
    'features/onboarding/WelcomeView.tsx',
    'features/reflection/EarlierReflectionsView.tsx',
    'features/reflection/ReflectionView.tsx'
]

for f in files:
    path = os.path.join('/Users/raiyanabdullah/dev/psychage-fresh/apps/mobile', f)
    if os.path.exists(path):
        with open(path, 'r') as file:
            content = file.read()
        content = content.replace('haptic="soft"', 'haptic="tab"')
        with open(path, 'w') as file:
            file.write(content)
        print(f"Fixed {f}")
