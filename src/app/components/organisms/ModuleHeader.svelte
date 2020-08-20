<script>
    import { Group, IconButton } from 'Atoms'
    import { User, IconText } from 'Molecules'
</script>

<Group direction="row" width="100%" justify="space-between">

    <IconText></IconText>

    <Group direction="row">
        <IconButton size="2" icon="graph-up"></IconButton>
        <IconButton size="2" icon="bell"></IconButton>
        <IconButton size="2" icon="grid-3x3-gap"></IconButton>
        <User margin="0em 0em 0em 2em"></User>
    </Group>

    

</Group>